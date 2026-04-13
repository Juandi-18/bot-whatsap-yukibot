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

// Cargamos los comandos al iniciar
seeCommands();

export default async (client, m) => {
    if (!m || !m.chat) return;

    // --- 1. NORMALIZACIÓN DE IDs (Seguridad total) ---
    const chatJid = client.decodeJid(m.chat);
    const senderJid = client.decodeJid(m.sender);
    const botJid = client.decodeJid(client.user.id.split(':')[0] + '@s.whatsapp.net');

    // --- 2. REGISTRO DE MEMORIA (Para comando Clean) ---
    if (!client.messages) client.messages = {};
    if (!client.messages[chatJid]) client.messages[chatJid] = { array: [] };
    client.messages[chatJid].array.push(m);
    if (client.messages[chatJid].array.length > 100) client.messages[chatJid].array.shift();

    // Ignorar mensajes de sistema o del propio bot para evitar bucles
    if ((m.id.startsWith("3EB0") || (m.id.startsWith("BAE5") && m.id.length === 16))) return;
    
    // Inicializar DB y Antilink
    initDB(m, client);
    antilink(client, m);

    // --- 3. VARIABLES DE BASE DE DATOS ---
    const db = global.db.data;
    const chat = db.chats[chatJid] || {};
    const settings = db.settings[botJid] || {};
    const user = db.users[senderJid] ||= {};
    const users = chat.users ? chat.users[senderJid] || {} : {};

    if (users) users.lastCmd = Date.now(); 

    // --- 4. METADATOS Y TIEMPO ---
    const pushname = m.pushName || 'Usuario';
    const time = moment.tz('America/Bogota').format('DD/MM/YY HH:mm:ss'); 
    
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

    // --- 6. PROCESAMIENTO DE COMANDOS ---
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

    // --- 8. FILTROS DE SEGURIDAD ---
    if (settings.onlyOwnerMode && !isOwners && !m.key.fromMe) return;
    if (chat?.isBanned && !isOwners && !isAdmins && !m.key.fromMe) return;

    const cmdData = global.comandos.get(command);
    if (!cmdData) return;

    // --- 9. FILTRO FAMILY FRIENDLY ---
    if (chat.familyFriendly && !isOwners && !m.key.fromMe) {
        // Bloqueo de categoría NSFW
        if (cmdData.category === 'nsfw') {
            return m.reply("⚠️ El modo *Family Friendly* está activo. Comandos NSFW bloqueados.");
        }
        // Bloqueo específico de comandos de imagen
        const imgCommands = ['imagen', 'img', 'image'];
        if (imgCommands.includes(command)) {
            return m.reply("⚠️ La búsqueda de imágenes está desactivada en este grupo.");
        }
    }

    // --- 10. VALIDACIÓN DE PERMISOS DEL COMANDO ---
    if (cmdData.isAdmin && !isAdmins && !isOwners) {
        return m.reply("《✧》 Solo Admins pueden usar este comando. ♡");
    }

    if (cmdData.botAdmin && !isBotAdmins) {
        return m.reply("《✧》 ¡Hazme Administrador del grupo primero! ♡");
    }

    if (cmdData.isOwner && !isOwners) {
        return; // Ignorar en silencio comandos de dueño si no lo es
    }

    // --- 11. EJECUCIÓN FINAL ---
    try {
        await client.readMessages([m.key]);
        user.usedcommands = (user.usedcommands || 0) + 1;
        
        const result = await cmdData.run(client, m, args, usedPrefix, command, text);
        
        if (result && result.key) {
            if (!client.messages[chatJid]) client.messages[chatJid] = { array: [] };
            client.messages[chatJid].array.push(result);
        }
        
    } catch (error) {
        console.error(chalk.red(`[ERROR]:`), error);
    }
    
    level(m);
};
