import fetch from 'node-fetch';
import { getDevice } from '@whiskeysockets/baileys';
import fs from 'fs';
import axios from 'axios';
import moment from 'moment-timezone';
import { bodyMenu, commands } from '../../core/commands.js';

function normalize(text = '') {
  text = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  return text.endsWith('s') ? text.slice(0, -1) : text;
}

export default {
  command: ['allmenu', 'help', 'menu'],
  category: 'info',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      const botId = client?.user?.id.split(':')[0] + '@s.whatsapp.net';
      const botSettings = global.db.data.settings[botId] || {};
      
      const botname = botSettings.botname || 'YukiBot-MD';
      const namebot = botSettings.namebot || 'User';
      
      // Imagen por defecto (puedes cambiar este link si prefieres otra imagen fija)
      const banner = botSettings.banner || 'https://mir-s3-cdn-cf.behance.net/projects/404/203f3b67773387.Y3JvcCwxMDMxLDgwNiwyNzAsMTUw.jpg'; 
      
      const canalId = botSettings.id || '0029VaGWwUfB4hdVxH1MDu43';

      const alias = {
        anime: ['anime', 'reacciones'],
        downloads: ['downloads', 'descargas'],
        economia: ['economia', 'economy', 'eco'],
        gacha: ['gacha', 'rpg'],
        grupo: ['grupo', 'group'],
        nsfw: ['nsfw', '+18'],
        profile: ['profile', 'perfil'],
        sockets: ['sockets', 'bots'],
        stickers: ['stickers', 'sticker'],
        utils: ['utils', 'utilidades', 'herramientas']
      };

      const input = normalize(args[0] || '');
      const cat = Object.keys(alias).find(k => alias[k].map(normalize).includes(input));
      
      const sections = commands;
      const content = cat ? String(sections[cat] || '') : Object.values(sections).map(s => String(s || '')).join('\n\n');

      // --- DISEÑO DEL MENÚ CON LA NUEVA URL ---
      let menuTexto = `𝐇𝐨𝐥𝐚! 𝐒𝐨𝐲 ${botname}\n`;
      menuTexto += `ᴀǫᴜɪ ᴛɪᴇɴᴇs ʟᴀ ʟɪsᴛᴀ ᴅᴇ ᴄᴏᴍᴀɴᴅᴏs\n`;
      menuTexto += `╭┈ ↷\n`;
      menuTexto += `│ ✐ 𝓓𝓮𝔀𝓮𝓵𝓸𝓹𝓮𝓭 𝓫𝔂 Juandi-18 ❤️\n`;
      menuTexto += `│ ✐ ꒷ꕤ💎ദ ᴄᴏᴍᴀɴᴅᴏs ෴\n`;
      menuTexto += `│ https://comands.com\n`;
      menuTexto += `│ ✐ ꒷ꕤ💎ദ ᴄᴀɴᴀʟ ᴏғɪᴄɪᴀʟ ෴\n`;
      menuTexto += `│ https://whatsapp.com/channel/${canalId.split('@')[0]}\n`;
      menuTexto += `╰─────────────────\n\n`;
      
      menuTexto += content;
      menuTexto = menuTexto.replace(/\$prefix/g, usedPrefix);

      // --- CONFIGURACIÓN DE ENVÍO TIPO IMAGEN INTERACTIVA ---
      // Esta configuración asegura que la imagen salga vertical y sea clickeable
      const messageOptions = {
        image: { url: banner }, // Aquí va la URL de tu banner
        caption: menuTexto,      // Texto del menú abajo de la imagen
        mentions: [m.sender],
        
        contextInfo: {
          forwardingScore: 0,
          isForwarded: false,
          
          // --- ESTA ES LA CLAVE ---
          // Esta sección crea el enlace interactivo al hacer clic en la foto
          externalAdReply: {
            title: botname,
            body: `Developer: Juandi-18`, // Pon aquí lo que quieras
            sourceUrl: "https://comands.com", // URL a donde redirige
            mediaType: 2, // ¡Cambio a tipo 2 (Video/Live)! A veces ayuda a mantener la verticalidad.
            renderLargerThumbnail: false, // ¡FALSO! Queremos que la imagen la envíe Baileys, no WhatsApp.
            // thumbnailUrl: banner // ¡NO! Quitamos esto para que no duplique.
          }
        }
      };

      // Enviamos solo UN mensaje de tipo imagen interactiva
      await client.sendMessage(m.chat, messageOptions, { quoted: m });

    } catch (e) {
      console.error(e);
      await m.reply(`> Ha ocurrido un error crítico: *${e.message}*`);
    }
