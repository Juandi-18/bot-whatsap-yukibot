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
    if (!client.messages) client.messages = {};
    if (!client.messages[m.chat]) client.messages[m.chat] = { array: [] };
    
    client.messages[m.chat].array.push(m);
    
    if (client.messages[m.chat].array.length > 100) {
        client.messages[m.chat].array.shift();
    }

    const sender = m.sender;
    let body = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || m.message?.videoMessage?.caption || '';
    
    if ((m.id.startsWith("3EB0") || (m.id.startsWith("BAE5") && m.id.length === 16) || (m.id.startsWith("B24E") && m.id.length === 20))) return;
    
    initDB(m, client);
    antilink(client, m);

    const from = m.chat;
    const botJid = client.user.id.split(':')[0] + '@s.whatsapp.net';
    const chat = global.db.data.chats[m.chat] || {};
    const settings = global.db.data.settings[botJid] || {};
    const user = global.db.data.users[sender] ||= {};
    const users = chat.users ? chat.users[sender] || {} : {};

    // --- REGISTRO DE ACTIVIDAD ---
    if (users) users.lastCmd = Date.now(); 

    const pushname = m.pushName || 'Sin nombre';
    
    let groupMetadata = null;
    let groupAdmins = [];
    let groupName = '';
    if (m.isGroup) {
        groupMetadata = await client.groupMetadata(m.chat).catch(() => null);
        groupName = groupMetadata?.subject || '';
        groupAdmins = groupMetadata?.participants.filter(p => (p.admin === 'admin' || p.admin === 'superadmin')) || [];
    }  

    // --- IDENTIFICACIÓN DE ROLES (MEJORADA) ---
    const isBotAdmins = m.isGroup ? groupAdmins.some(p => client.decodeJid(p.id) === client.decodeJid(botJid)) : false;
    const isAdmins = m.isGroup ? groupAdmins.some(p => client.decodeJid(p.id) === client.decodeJid(sender)) : false;
    
    const owners = [
        botJid, 
        ...(settings.owner ? [settings.owner] : []), 
        ...global.owner.map(num => num.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
    ];
    const isOwners = owners.map(v => client.decodeJid(v)).includes(client.decodeJid(sender));

    // --- FILTROS DE ACCESO (SANEADOS) ---
    
    // Modo Solo Dueño (Solo bloquea si está encendido en la DB)
    if (settings.onlyOwnerMode && !isOwners && !m.key.fromMe) return;

    // Filtro de Baneos de Grupo
    if (chat?.isBanned && !isOwners && !isAdmins && !m.key.fromMe) return;

    // --- PROCESAMIENTO DE PREFIJOS Y COMANDOS ---
    const rawBotname = settings.namebot || 'Yuki';
    const namebot = rawBotname.replace(/[^a-zA-Z0-9\s]/g, '') || 'Yuki';
    
    let usedPrefix = '/'; // Prefijo por defecto si falla el regex
    const prefixArray = Array.isArray(settings.prefix) ? settings.prefix : [settings.prefix || '!'];
    const prefixRegex = new RegExp('^[' + prefixArray.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('') + ']', 'i');
    
    const isCmd = prefixRegex.test(m.text);
    if (!isCmd) return;

    usedPrefix = m.text.match(prefixRegex)[0];
    let args = m.text.slice(usedPrefix.length).trim().split(/ +/);
    let command = args.shift().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let text = args.join(' ');

    if (!command) return;

    // Log de consola con colores
    console.log(chalk.bold.blue(`╭────────────────────────────···\n│ ${chalk.cyan('Bot')}: ${botJid}\n│ ${chalk.bold.yellow('Fecha')}: ${moment().format('DD/MM/YY HH:mm:ss')}\n│ ${chalk.bold.blueBright('Usuario')}: ${pushname}\n${m.isGroup ? '│' + chalk.bold.green(' Grupo') + ': ' + groupName : '│' + chalk.bold.green(' Privado')}\n│ ${chalk.bold.cyanBright('Comando')}: ${command}\n╰────────────────────────────···\n`));

    const cmdData = global.comandos.get(command);
    if (!cmdData) {
        return m.reply(`ꕤ El comando *${usedPrefix + command}* no existe. Usa *${usedPrefix}help* para ver la lista.`);
    }

    // --- VALIDACIÓN DE PERMISOS DEL COMANDO ---
    if (cmdData.isAdmin && !isAdmins && !isOwners) {
        return m.reply("《✧》 Este comando es solo para *Administradores* del grupo. ♡");
    }

    if (cmdData.botAdmin && !isBotAdmins) {
        return m.reply("《✧》 Necesito ser *Administrador* para ejecutar esta acción. ♡");
    }

    if (cmdData.isOwner && !isOwners) {
        return m.reply("《✧》 Este comando es exclusivo de mi *Creador*. ♡");
    }

    // --- EJECUCIÓN ---
    try {
        await client.readMessages([m.key]);
        if (user) user.usedcommands = (user.usedcommands || 0) + 1;
        
        const result = await cmdData.run(client, m, args, usedPrefix, command, text);
        
        if (result && result.key) {
            if (!client.messages[m.chat]) client.messages[m.chat] = { array: [] };
            client.messages[m.chat].array.push(result);
        }
        
    } catch (error) {
        console.error("Error en ejecución:", error);
        await client.sendMessage(m.chat, { text: `《✧》 Error Interno: ${error.message}` }, { quoted: m });
    }
    
    level(m);
};
