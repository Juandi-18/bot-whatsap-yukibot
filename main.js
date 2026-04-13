import ws from 'ws';
import moment from 'moment-timezone';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import gradient from 'gradient-string';
import seeCommands from './core/system/commandLoader.js';
import initDB from './core/system/initDB.js';
import antilink from './cmds/antilink.js';
import level from './cmds/level.js';

seeCommands();

export default async (client, m) => {
    if (!m || !m.chat) return;

    // --- NORMALIZACIÓN DE IDs (Seguridad de Identidad) ---
    const chatJid = client.decodeJid(m.chat);
    const senderJid = client.decodeJid(m.sender);
    const botJid = client.decodeJid(client.user.id);

    // --- REGISTRO DE MENSAJES PARA COMANDO CLEAN ---
    if (!client.messages) client.messages = {};
    if (!client.messages[chatJid]) client.messages[chatJid] = { array: [] };
    client.messages[chatJid].array.push(m);
    if (client.messages[chatJid].array.length > 100) client.messages[chatJid].array.shift();

    // Bloqueo de mensajes automáticos de sistema (BAE5, 3EB0)
    if ((m.id.startsWith("3EB0") || (m.id.startsWith("BAE5") && m.id.length === 16))) return;
    
    // Inicialización de Base de Datos
    initDB(m, client);
    antilink(client, m);

    const db = global.db.data;
    const chat = db.chats[chatJid] || {};
    const settings = db.settings[botJid] || {};
    const user = db.users[senderJid] ||= {};
    const groupUser = (chat.users && chat.users[senderJid]) ? chat.users[senderJid] : null;

    if (groupUser) groupUser.lastCmd = Date.now(); 

    // --- OBTENCIÓN DE METADATOS (Nombre de grupo y hora) ---
    const pushname = m.pushName || 'Usuario Desconocido';
    const time = moment.tz('America/Bogota').format('DD/MM/YY HH:mm:ss'); // Ajustado a tu zona horaria
    
    let groupMetadata = null;
    let groupAdmins = [];
    let groupName = '';

    if (m.isGroup) {
        groupMetadata = await client.groupMetadata(chatJid).catch(() => null);
        groupName = groupMetadata?.subject || 'Grupo Desconocido';
        groupAdmins = groupMetadata?.participants.filter(p => (p.admin === 'admin' || p.admin === 'superadmin')) || [];
    }  

    // --- ROLES ---
    const isBotAdmins = m.isGroup ? groupAdmins.some(p => client.decodeJid(p.id) === botJid) : false;
    const isAdmins = m.isGroup ? groupAdmins.some(p => client.decodeJid(p.id) === senderJid) : false;
    const owners = [botJid, ...(settings.owner ? [settings.owner] : []), ...global.owner.map(num => num.replace(/[^0-9]/g, '') + '@s.whatsapp.net')];
    const isOwners = owners.map(v => client.decodeJid(v)).includes(senderJid);

    // --- PROCESAMIENTO DE PREFIJOS ---
    const prefixArray = Array.isArray(settings.prefix) ? settings.prefix : [settings.prefix || '!'];
    const prefixRegex = new RegExp('^[' + prefixArray.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('') + ']', 'i');
    
    const isCmd = prefixRegex.test(m.text);
    if (!isCmd) return;

    const usedPrefix = m.text.match(prefixRegex)[0];
    const args = m.text.slice(usedPrefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const text = args.join(' ');

    if (!command) return;

    // --- LOGS DE CONSOLA (DISEÑO ORIGINAL RECUPERADO) ---
    console.log(chalk.bold.blue(`╭────────────────────────────···
│ ${chalk.cyan('Bot')}: ${gradient('lime', 'green')(botJid)}
│ ${chalk.bold.yellow('Fecha')}: ${gradient('orange', 'yellow')(time)}
│ ${chalk.bold.blueBright('Usuario')}: ${gradient('cyan', 'blue')(pushname)}
│ ${chalk.bold.magentaBright('Remitente')}: ${gradient('deepskyblue', 'darkorchid')(senderJid)}
${m.isGroup ? '│' + chalk.bold.green(' Grupo') + ': ' + gradient('green', 'lime')(groupName) : '│' + chalk.bold.green(' Privado') + ': ' + gradient('pink', 'magenta')('Chat Privado')}
${'│' + chalk.bold.magenta(' ID') + ': ' + gradient('violet', 'midnightblue')(chatJid)}
│ ${chalk.bold.cyanBright('Comando usado')}: ${chalk.white.bgBlack(' ' + command + ' ')}
╰────────────────────────────···\n`));

    // --- FILTROS DE ACCESO ---
    if (settings.onlyOwnerMode && !isOwners && !m.key.fromMe) return;
    if (chat?.isBanned && !isOwners && !isAdmins && !m.key.fromMe) return;

    const cmdData = global.comandos.get(command);
    if (!cmdData) return;

    // --- VERIFICACIÓN DE PERMISOS ---
    if (cmdData.isAdmin && !isAdmins && !isOwners) return m.reply("《✧》 Este comando es solo para Admins. ♡");
    if (cmdData.botAdmin && !isBotAdmins) return m.reply("《✧》 Necesito ser Admin del grupo para esto. ♡");

    // --- EJECUCIÓN ---
    try {
        await client.readMessages([m.key]);
        user.usedcommands = (user.usedcommands || 0) + 1;
        
        const result = await cmdData.run(client, m, args, usedPrefix, command, text);
        
        if (result && result.key) {
            if (!client.messages[chatJid]) client.messages[chatJid] = { array: [] };
            client.messages[chatJid].array.push(result);
        }
        
    } catch (error) {
        console.error(chalk.red(`[ERROR EN ${command}]:`), error);
    }
    
    level(m);
};
