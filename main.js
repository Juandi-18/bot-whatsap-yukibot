import ws from 'ws';
import moment from 'moment';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import gradient from 'gradient-string';
import seeCommands from './core/system/commandLoader.js';
import initDB from './core/system/initDB.js';
import antilink from './cmds/antilink.js';
import level from './cmds/level.js';
import { getGroupAdmins } from './core/message.js';

seeCommands();

export default async (client, m) => {
  if (!m || !m.chat) return;

  // --- REGISTRO GLOBAL DE MENSAJES PARA EL COMANDO CLEAN ---
  // Se coloca aquí para que guarde TODO antes de cualquier filtro
  if (!client.messages) client.messages = {};
  if (!client.messages[m.chat]) client.messages[m.chat] = { array: [] };
  
  // Guardamos el mensaje actual en el historial (texto, multimedia o comando)
  client.messages[m.chat].array.push(m);
  
  // Mantenemos la memoria optimizada (máximo 100 mensajes)
  if (client.messages[m.chat].array.length > 100) {
    client.messages[m.chat].array.shift();
  }

  // Log opcional para verificar en terminal que está leyendo mensajes normales
  // console.log(chalk.gray(`[MEMORIA] Mensaje registrado en: ${m.chat}`));
  // -------------------------------------------------------

  const sender = m.sender;
  let body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply?.selectedRowId || m.message.templateButtonReplyMessage?.selectedId || '';
  
  if ((m.id.startsWith("3EB0") || (m.id.startsWith("BAE5") && m.id.length === 16) || (m.id.startsWith("B24E") && m.id.length === 20))) return
  
  initDB(m, client)
  antilink(client, m);

  const from = m.key.remoteJid;
  const botJid = client.user.id.split(':')[0] + '@s.whatsapp.net' || client.user.lid;
  const chat = global.db.data.chats[m.chat] || {}
  const settings = global.db.data.settings[botJid] || {}
  const user = global.db.data.users[sender] ||= {}
  const users = chat.users[sender] || {}
  const pushname = m.pushName || 'Sin nombre';
  
  let groupMetadata = null
  let groupAdmins = []
  let groupName = ''
  if (m.isGroup) {
    groupMetadata = await client.groupMetadata(m.chat).catch(() => null)
    groupName = groupMetadata?.subject || ''
    groupAdmins = groupMetadata?.participants.filter(p => (p.admin === 'admin' || p.admin === 'superadmin')) || []
  }  
  const isBotAdmins = m.isGroup ? groupAdmins.some(p => p.phoneNumber === botJid || p.jid === botJid || p.id === botJid || p.lid === botJid ) : false
  const isAdmins = m.isGroup ? groupAdmins.some(p => p.phoneNumber === sender || p.jid === sender || p.id === sender || p.lid === sender ) : false
  const isOwners = [botJid, ...(settings.owner ? [settings.owner] : []), ...global.owner.map(num => num + '@s.whatsapp.net')].includes(sender);
  // --- INTERRUPTOR PRIVADO ---
  // settings.onlyOwnerMode es la variable que controlaremos con el comando
  if (settings.onlyOwnerMode && !isOwners && !m.key.fromMe) {
    return; // Si el modo privado está ON y no eres dueño ni el bot, se detiene todo aquí.
  }

  // Plugins All
  for (const name in global.plugins) {
    const plugin = global.plugins[name];
    if (plugin && typeof plugin.all === "function") {
      try {
        await plugin.all.call(client, m, { client });
      } catch (err) {
        console.error(`Error en plugin.all -> ${name}`, err);
      }
    }
  }

  const today = new Date().toLocaleDateString('es-CO', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
  if (!users.stats) users.stats = {};
  if (!users.stats[today]) users.stats[today] = { msgs: 0, cmds: 0 };
  users.stats[today].msgs++;
  
  // Configuración de prefijos
  const rawBotname = settings.namebot || 'Yuki';
  const tipo = settings.type || 'Sub';
  const cleanBotname = rawBotname.replace(/[^a-zA-Z0-9\s]/g, '')
  const namebot = cleanBotname || 'Yuki';
  const shortForms = [namebot.charAt(0), namebot.split(" ")[0], tipo.split(" ")[0], namebot.split(" ")[0].slice(0, 2), namebot.split(" ")[0].slice(0, 3)];
  const prefixes = shortForms.map(name => `${name}`);
  prefixes.unshift(namebot);
  let prefix;
  if (Array.isArray(settings.prefix) || typeof settings.prefix === 'string') {
    const prefixArray = Array.isArray(settings.prefix) ? settings.prefix : [settings.prefix];
    prefix = new RegExp('^(' + prefixes.join('|') + ')?(' + prefixArray.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'i');
  } else if (settings.prefix === true) {
    prefix = new RegExp('^', 'i');
  } else {
    prefix = new RegExp('^(' + prefixes.join('|') + ')?', 'i');
  }
  
  const strRegex = (str) => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
  let pluginPrefix = client.prefix ? client.prefix : prefix;
  let matchs = pluginPrefix instanceof RegExp ? [[pluginPrefix.exec(m.text), pluginPrefix]] : Array.isArray(pluginPrefix) ? pluginPrefix.map(p => {
    let regex = p instanceof RegExp ? p : new RegExp(strRegex(p));
    return [regex.exec(m.text), regex];
  }) : typeof pluginPrefix === 'string' ? [[new RegExp(strRegex(pluginPrefix)).exec(m.text), new RegExp(strRegex(pluginPrefix))]] : [[null, null]];
  let match = matchs.find(p => p[0]);

  // Filtro de Before
  for (const name in global.plugins) {
    const plugin = global.plugins[name];
    if (!plugin) continue;
    if (plugin.disabled) continue;
    if (typeof plugin.before === "function") {
      try {
        if (await plugin.before.call(client, m, { client })) continue;
      } catch (err) {
        console.error(`Error en plugin.before -> ${name}`, err);
      }
    }
  }

  // --- El bot ya guardó el mensaje arriba, así que si no es comando, aquí termina el flujo ---
  if (!match) return;

  let usedPrefix = (match[0] || [])[0] || '';
  let args = m.text.slice(usedPrefix.length).trim().split(" ");
  let command = (args.shift() || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let text = args.join(' ');
  if (!command) return;

  // Log de comandos en consola
  const chatData = global.db.data.chats[from] || {};
  const consolePrimary = chatData.primaryBot;
  if (m.message || !consolePrimary || consolePrimary === botJid) {
    console.log(chalk.bold.blue(`╭────────────────────────────···\n│ ${chalk.cyan('Bot')}: ${gradient('lime', 'green')(botJid)}\n│ ${chalk.bold.yellow('Fecha')}: ${gradient('orange', 'yellow')(moment().format('DD/MM/YY HH:mm:ss'))}\n│ ${chalk.bold.blueBright('Usuario')}: ${gradient('cyan', 'blue')(pushname)}\n│ ${chalk.bold.magentaBright('Remitente')}: ${gradient('deepskyblue', 'darkorchid')(sender)}\n${m.isGroup ? '│' + chalk.bold.green(' Grupo') + ': ' + gradient('green', 'lime')(groupName) : '│' + chalk.bold.green(' Privado') + ': ' + gradient('pink', 'magenta')('Chat Privado')}\n${'│' + chalk.bold.magenta(' ID') + ': ' + gradient('violet', 'midnightblue')(m.isGroup ? from : 'Chat Privado')}\n│ ${chalk.bold.cyanBright('Comando usado')}: ${chalk.gray(command ? command : 'No Command')}\n╰────────────────────────────···\n`));
  }
  
  // Validaciones de dueños y baneos
  if (!isOwners && settings.self) return;  
  if (m.chat && !m.chat.endsWith('g.us')) {
     const allowedInPrivateForUsers = ['help', 'menu', 'ping', 'speed', 'status', 'estado'] // Lista resumida
     if (!isOwners && !allowedInPrivateForUsers.includes(command)) return;
  }
  if (chat?.isBanned && !(command === 'bot' && text === 'on') && !isOwners) {
     await m.reply(`ꕥ El bot está desactivado aquí.`);
     return;
  }

  const cmdData = global.comandos.get(command);
  if (!cmdData) {
     if (settings.prefix === true) return;
     await client.readMessages([m.key]);
     return m.reply(`ꕤ El comando *${command}* no existe.`);
  }

  // Validación de Admins
  // --- VALIDACIÓN DE PERMISOS UNIFICADA (ADMIN / DUEÑO / BOT) ---
  if (cmdData.isAdmin) {
    const tienePermiso = isAdmins || isOwners || m.key.fromMe; // El "||" significa "O"
      if (!tienePermiso) {
        return client.reply(m.chat, "❌ Solo Admins, el Dueño o el Bot pueden usar esto.", m);
      }
  }

  // Validación de que el BOT sea admin para poder ejecutar (ej: kick, promote)
  if (cmdData.botAdmin && !isBotAdmins) {
      return client.reply(m.chat, "❌ *Error de permisos*\nNecesito ser Administrador del grupo para realizar esta acción.", m);
  }
  // --------------------------------------------------------------
  try {
     await client.readMessages([m.key]);
     user.usedcommands = (user.usedcommands || 0) + 1;
     users.stats[today].cmds++;
     
     // --- EJECUCIÓN Y CAPTURA DE RESPUESTA DEL BOT ---
     const result = await cmdData.run(client, m, args, usedPrefix, command, text);
     
     // Si el comando devuelve el mensaje enviado (result), lo guardamos para el Clean
     if (result && result.key) {
        if (!client.messages[m.chat]) client.messages[m.chat] = { array: [] };
        client.messages[m.chat].array.push(result);
     }
     
  } catch (error) {
     console.error("Error en ejecución:", error);
     await client.sendMessage(m.chat, { text: `《✧》 Error: ${error.message}` }, { quoted: m });
  }
  level(m);
};
