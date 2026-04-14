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

    // --- 1. NORMALIZACIÓN DE IDs ---
    const chatJid = client.decodeJid(m.chat);
    const senderJid = client.decodeJid(m.sender);
    const botJid = client.decodeJid(client.user.id.split(':')[0] + '@s.whatsapp.net');

    // --- 2. REGISTRO DE MEMORIA (Para que el comando !del funcione) ---
    if (!client.messages) client.messages = {};
    if (!client.messages[chatJid]) client.messages[chatJid] = { array: [] };

    // Guarda TODO (Stickers, Imágenes, Texto, etc.)
    client.messages[chatJid].array.push(m); 

    // Mantenemos un límite de 100 mensajes para que Termux no se sature de memoria
    if (client.messages[chatJid].array.length > 100) client.messages[chatJid].array.shift();

    // Filtros de bots y WhatsApp Web
    if (m.id.startsWith("BAE5") && m.id.length === 16) return; 
    
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
    if (settings.onlyOwnerMode && !isOwners) return; 
    if (chat?.isBanned && !isOwners && !isAdmins) return;

    const cmdData = global.comandos.get(command);
    if (!cmdData) return;

    // --- 9. FILTRO FAMILY FRIENDLY (Prioridad Máxima & Anti-Evasión) ---
    if (chat.familyFriendly) {
        
        // A. Bloquear comandos de administración de NSFW
        if (command === 'nsfw' || command === 'modonsfw') {
            return m.reply("⚠️ El modo *Family Friendly* está activo. Debes desactivarlo (!ff off) para realizar cambios en el contenido sensible.");
        }

        // B. Bloquear categorías NSFW o comandos de imagen directa
        if (cmdData.category === 'nsfw' || ['imagen', 'img', 'image', 'pinterest'].includes(command)) {
            return m.reply("⚠️ Este grupo está protegido por el modo *Family Friendly*. El contenido sensible está bloqueado.");
        }

        // C. Filtro de Búsqueda Inteligente y Anti-Evasión (TikTok, YouTube, etc.)
        const searchCommands = ['tiktok', 'tt', 'tts', 'yts', 'ytsearch', 'google'];
        if (searchCommands.includes(command) && text) {
            
            // Limpieza Extrema del Texto
            let cleanText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            
            // Revertir Leetspeak
            cleanText = cleanText.replace(/[0@]/g, 'o')
                                 .replace(/1/g, 'i')
                                 .replace(/3/g, 'e')
                                 .replace(/4/g, 'a')
                                 .replace(/5/g, 's')
                                 .replace(/7/g, 't');
            
            // Texto sin espacios (para detectar p.o.r.n.o o p o r n o)
            const squishedText = cleanText.replace(/[^a-z0-9]/g, ''); 

            // Raíces Fuertes (bloquean todo)
            const hardcoreRoots = [
                'porn', 'hentai', 'xnx', 'xxx', 'gore', 'rule34', 'r34', 
                'boobs', 'tetas', 'pene', 'culo', 'pedofil', 'lactand', 'bikini', 'desnud'
            ];
            
            // Palabras Exactas (requieren espacios para no bloquear palabras sanas)
            const exactWords = ['sexo', 'cp', 'nude', 'ass'];

            // Verificación Dual
            let isProhibited = hardcoreRoots.some(root => squishedText.includes(root));
            
            if (!isProhibited) {
                isProhibited = exactWords.some(word => new RegExp(`\\b${word}\\b`, 'i').test(cleanText));
            }

            if (isProhibited) {
                return m.reply("⚠️ Tu búsqueda contiene variaciones de palabras restringidas por el escudo *Family Friendly*. ♡");
            }
        }
    }

    // --- 10. VALIDACIÓN DE PERMISOS ---
    if (cmdData.isAdmin && !isAdmins && !isOwners) {
        return m.reply("《✧》 Solo Admins pueden usar este comando. ♡");
    }

    if (cmdData.botAdmin && !isBotAdmins) {
        return m.reply("《✧》 ¡Hazme Administrador del grupo primero! ♡");
    }

    if (cmdData.isOwner && !isOwners) return;

    // --- 11. EJECUCIÓN FINAL ---
    try {
        await client.readMessages([m.key]);
        user.usedcommands = (user.usedcommands || 0) + 1;
        
        // Ejecutamos el comando y guardamos el resultado
        const result = await cmdData.run(client, m, { args, usedPrefix, command, text });
        
        // Guardamos la respuesta del bot en la memoria para que !del la pueda borrar
        if (result && result.key) {
            if (!client.messages[chatJid]) client.messages[chatJid] = { array: [] };
            client.messages[chatJid].array.push(result);
        }
        
    } catch (error) {
        console.error(chalk.red(`[ERROR]:`), error);
    }
    
    level(m);
};
