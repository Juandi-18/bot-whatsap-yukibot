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

seeCommands();

export default async (client, m) => {
    if (!m || !m.chat) return;

    // --- NORMALIZACIÓN DE IDs (Evita confusiones) ---
    const chatJid = client.decodeJid(m.chat);
    const senderJid = client.decodeJid(m.sender);
    const botJid = client.decodeJid(client.user.id);

    // --- REGISTRO AISLADO POR CHAT ID ---
    if (!client.messages) client.messages = {};
    if (!client.messages[chatJid]) client.messages[chatJid] = { array: [] };
    
    client.messages[chatJid].array.push(m);
    if (client.messages[chatJid].array.length > 100) client.messages[chatJid].array.shift();

    // Evitar responder a otros bots o mensajes automáticos del sistema
    if ((m.id.startsWith("3EB0") || (m.id.startsWith("BAE5") && m.id.length === 16))) return;
    
    // Inicializar base de datos con IDs limpios
    initDB(m, client);
    antilink(client, m);

    // --- ACCESO ÚNICO A LA BASE DE DATOS ---
    const db = global.db.data;
    const chat = db.chats[chatJid] || {};
    const settings = db.settings[botJid] || {};
    const user = db.users[senderJid] ||= {};
    const groupUser = (chat.users && chat.users[senderJid]) ? chat.users[senderJid] : null;

    // Registrar actividad con timestamp único
    if (groupUser) groupUser.lastCmd = Date.now(); 

    const pushname = m.pushName || 'Usuario';
    
    let groupMetadata = null;
    let groupAdmins = [];
    let groupName = '';

    if (m.isGroup) {
        groupMetadata = await client.groupMetadata(chatJid).catch(() => null);
        groupName = groupMetadata?.subject || '';
        groupAdmins = groupMetadata?.participants.filter(p => (p.admin === 'admin' || p.admin === 'superadmin')) || [];
    }  

    // --- VALIDACIÓN DE ROLES POR ID DECODIFICADO ---
    const isBotAdmins = m.isGroup ? groupAdmins.some(p => client.decodeJid(p.id) === botJid) : false;
    const isAdmins = m.isGroup ? groupAdmins.some(p => client.decodeJid(p.id) === senderJid) : false;
    
    const owners = [
        botJid, 
        ...(settings.owner ? [settings.owner] : []), 
        ...global.owner.map(num => num.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
    ];
    const isOwners = owners.map(v => client.decodeJid(v)).includes(senderJid);

    // --- FILTROS DE SEGURIDAD ---
    if (settings.onlyOwnerMode && !isOwners && !m.key.fromMe) return;
    if (chat?.isBanned && !isOwners && !isAdmins && !m.key.fromMe) return;

    // --- PROCESAMIENTO DE PREFIJOS ---
    const prefixArray = Array.isArray(settings.prefix) ? settings.prefix : [settings.prefix || '!'];
    const prefixRegex = new RegExp('^[' + prefixArray.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('') + ']', 'i');
    
    if (!prefixRegex.test(m.text)) return;

    const usedPrefix = m.text.match(prefixRegex)[0];
    const args = m.text.slice(usedPrefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const text = args.join(' ');

    if (!command) return;

    // Log único en consola
    console.log(chalk.bold.cyan(`[ ID: ${chatJid.split('@')[0]} ]`) + chalk.white(` Comando: ${command} | De: ${pushname}`));

    const cmdData = global.comandos.get(command);
    if (!cmdData) return; // Si no existe, ignoramos en silencio para evitar spam

    // --- VERIFICACIÓN DE PERMISOS ---
    if (cmdData.isAdmin && !isAdmins && !isOwners) return m.reply("《✧》 Solo Admins. ♡");
    if (cmdData.botAdmin && !isBotAdmins) return m.reply("《✧》 ¡Hazme Admin primero! ♡");
    if (cmdData.isOwner && !isOwners) return;

    // --- EJECUCIÓN DEL COMANDO ---
    try {
        await client.readMessages([m.key]);
        user.usedcommands = (user.usedcommands || 0) + 1;
        
        // Ejecución con JID limpio
        const result = await cmdData.run(client, m, args, usedPrefix, command, text);
        
        if (result && result.key) {
            if (!client.messages[chatJid]) client.messages[chatJid] = { array: [] };
            client.messages[chatJid].array.push(result);
        }
        
    } catch (error) {
        console.error(`ERROR EN ID ${chatJid}:`, error);
    }
    
    level(m);
};
