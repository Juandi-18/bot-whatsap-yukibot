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

global.prohibitedWords = []; 

export default async (client, m) => {
    if (!m || !m.chat) return;

    // --- 1. NORMALIZACIÓN DE IDs ---
    const chatJid = client.decodeJid(m.chat);
    const senderJid = client.decodeJid(m.sender);
    const botJid = client.decodeJid(client.user.id.split(':')[0] + '@s.whatsapp.net');

    // --- 2. REGISTRO DE MEMORIA (Para !del / !delete) ---
    if (!client.messages) client.messages = {};
    if (!client.messages[chatJid]) client.messages[chatJid] = { array: [] };
    
    // Guardamos el mensaje actual en la memoria para poder borrarlo luego
    client.messages[chatJid].array.push(m); 
    if (client.messages[chatJid].array.length > 100) client.messages[chatJid].array.shift();

    if (m.id.startsWith("BAE5") && m.id.length === 16) return; 
    
    // --- 3. INICIALIZACIÓN DE SISTEMAS ---
    initDB(m, client);
    antilink(client, m);
    
    // Ejecutamos el motor de niveles en cada mensaje (XP Silenciosa)
    await level(m);

    const db = global.db.data;
    const chat = db.chats[chatJid] || {};
    const settings = db.settings[botJid] || {};
    const user = db.users[senderJid] ||= {};
    const users = chat.users ? chat.users[senderJid] || {} : {};

    if (users) users.lastCmd = Date.now(); 

    // --- 4. METADATOS ---
    const pushname = m.pushName || 'Usuario';
    const time = moment.tz('America/Lima').format('DD/MM/YY HH:mm:ss'); 
    
    let groupMetadata = null;
    let groupAdmins = [];
    let groupName = '';

    if (m.isGroup) {
        groupMetadata = await client.groupMetadata(chatJid).catch(() => null);
        groupName = groupMetadata?.subject || 'Grupo';
        groupAdmins = groupMetadata?.participants.filter(p => (p.admin === 'admin' || p.admin === 'superadmin')) || [];
    }  

    // --- 5. ROLES Y PERMISOS ---
    const isBotAdmins = m.isGroup ? groupAdmins.some(p => client.decodeJid(p.id) === botJid) : false;
    const isAdmins = m.isGroup ? groupAdmins.some(p => client.decodeJid(p.id) === senderJid) : false;
    
    const owners = [
        botJid, 
        ...(settings.owner ? [settings.owner] : []), 
        ...global.owner.map(num => num.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
    ];
    const isOwners = owners.map(v => client.decodeJid(v)).includes(senderJid);

    // --- 6. PROCESAMIENTO DE COMANDO ---
    const prefixArray = Array.isArray(settings.prefix) ? settings.prefix : [settings.prefix || '!'];
    const prefixRegex = new RegExp('^[' + prefixArray.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('') + ']', 'i');
    
    if (!prefixRegex.test(m.text)) return;

    const usedPrefix = m.text.match(prefixRegex)[0];
    const args = m.text.slice(usedPrefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const text = args.join(' ');

    if (!command) return;

    // --- 7. LOGS DE CONSOLA ---
    console.log(chalk.bold.blue(`╭────────────────────────────···
│ ${chalk.cyan('Bot')}: ${gradient('lime', 'green')(botJid)}
│ ${chalk.bold.yellow('Fecha')}: ${gradient('orange', 'yellow')(time)}
│ ${chalk.bold.blueBright('Usuario')}: ${gradient('cyan', 'blue')(pushname)}
${m.isGroup ? '│' + chalk.bold.green(' Grupo') + ': ' + gradient('green', 'lime')(groupName) : '│' + chalk.bold.green(' Privado')}
│ ${chalk.bold.cyanBright('Comando')}: ${chalk.white.bgBlack(' ' + command + ' ')}
╰────────────────────────────···\n`));

    // --- 8. FILTROS BÁSICOS ---
    if (settings.onlyOwnerMode && !isOwners) return; 
    if (chat?.isBanned && !isOwners && !isAdmins) return;

    const cmdData = global.comandos.get(command);
    if (!cmdData) return;

    // --- 9. FILTRO FAMILY FRIENDLY ---
    if (chat.familyFriendly) {
        if (cmdData.category === 'nsfw' || ['nsfw', 'modonsfw'].includes(command)) {
            return m.reply("⚠️ El modo *Family Friendly* está activo. Contenido bloqueado.");
        }
    }

    // --- 10. VALIDACIÓN DE PERMISOS ---
    if (cmdData.isAdmin && !isAdmins && !isOwners) return m.reply("《✧》 Solo Admins pueden usar este comando. ♡");
    if (cmdData.botAdmin && !isBotAdmins) return m.reply("《✧》 ¡Hazme Administrador del grupo primero! ♡");
    if (cmdData.isOwner && !isOwners) return;

    // --- 10.5 INYECCIÓN DE AZAR (VERSION TRUJILLO ULTRA) ---
    if (['accion', 'social', 'nsfw', 'anime'].includes(cmdData.category)) {
        if (!m.mentionedJid[0] && !m.quoted) {
            if (m.isGroup && groupMetadata) {
                const participants = groupMetadata.participants.map(p => p.id);
                const filtered = participants.filter(p => p !== senderJid && p !== botJid);
                
                if (filtered.length > 0) {
                    const randomUser = filtered[Math.floor(Math.random() * filtered.length)];
                    m.mentionedJid = [randomUser];
                    
                    // Aseguramos que el objeto msg y contextInfo existan para los comandos
                    if (!m.msg) m.msg = m.message[Object.keys(m.message)[0]];
                    if (m.msg) {
                        if (!m.msg.contextInfo) m.msg.contextInfo = {};
                        m.msg.contextInfo.mentionedJid = [randomUser];
                    }
                }
            }
        }
    }

    // --- 11. EJECUCIÓN FINAL ---
    try {
        await client.readMessages([m.key]);
        user.usedcommands = (user.usedcommands || 0) + 1;
        
        // Ejecutamos el comando
        const result = await cmdData.run(client, m, args, usedPrefix, command, text);
        
        // Si el comando devuelve un mensaje (como un !level), lo guardamos en memoria para borrarlo con !del
        if (result && result.key) {
            if (!client.messages[chatJid]) client.messages[chatJid] = { array: [] };
            client.messages[chatJid].array.push(result);
        }
        
    } catch (error) {
        console.error(chalk.red(`[ERROR]:`), error);
        m.reply(`《✧》 Ocurrió un error al ejecutar el comando: ${error.message} ♡`);
    }
};
