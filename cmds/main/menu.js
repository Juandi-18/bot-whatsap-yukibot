import fetch from 'node-fetch';
import { getDevice } from '@whiskeysockets/baileys';
import fs from 'fs';
import axios from 'axios';
import moment from 'moment-timezone';
import { bodyMenu, menuObject } from '../../core/commands.js';

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
      
      const botname = botSettings.botname || 'YukiBot';
      const namebot = botSettings.namebot || 'Yuki-MD';
      const banner = botSettings.banner || '';
      const canalId = botSettings.id || '';
      const canalName = botSettings.nameid || 'Canal Oficial';

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
      
      const sections = menuObject;
      const content = cat ? String(sections[cat] || '') : Object.values(sections).map(s => String(s || '')).join('\n\n');

      // --- DISEÑO ESTILO ECHIDNA ---
      let menuTexto = `𝐇𝐨𝐥𝐚! 𝐒𝐨𝐲 ${botname} (${namebot})\n`;
      menuTexto += `ᴀǫᴜɪ ᴛɪᴇɴᴇs ʟᴀ ʟɪsᴛᴀ ᴅᴇ ᴄᴏᴍᴀɴᴅᴏs\n`;
      menuTexto += `╭┈ ↷\n`;
      menuTexto += `│ ✐ 𝓓𝓮𝔀𝓮𝓵𝓸𝓹𝓮𝓭 𝓫𝔂 Desconocido ❤️\n`;
      menuTexto += `│ ✐ ꒷ꕤ💎ദ ᴄᴏᴍᴀɴᴅᴏs ෴\n`;
      menuTexto += `│ https://nekos.club/commands\n`;
      menuTexto += `│ ✐ ꒷ꕤ💎ദ ᴄᴀɴᴀʟ ᴏғɪᴄɪᴀʟ ෴\n`;
      menuTexto += `│ https://whatsapp.com/channel/${canalId.split('@')[0]}\n`;
      menuTexto += `╰─────────────────\n\n`;
      menuTexto += content;

      // Reemplazamos el prefijo dinámicamente en los comandos del core
      menuTexto = menuTexto.replace(/\$prefix/g, usedPrefix);

      // --- ENVÍO LIMPIO (SIN REENVIADO FEO) ---
      const messageOptions = {
        caption: menuTexto,
        mentions: [m.sender],
        contextInfo: {
          // Esto quita la etiqueta de reenviado y la tarjeta de canal publicitaria
          forwardingScore: 0,
          isForwarded: false,
          externalAdReply: null 
        }
      };

      if (banner.includes('.mp4') || banner.includes('.webm')) {
        await client.sendMessage(m.chat, { video: { url: banner }, gifPlayback: true, ...messageOptions }, { quoted: m });
      } else {
        await client.sendMessage(m.chat, { image: { url: banner }, ...messageOptions }, { quoted: m });
      }

    } catch (e) {
      await m.reply(`> Ha ocurrido un error: *${e.message}*`)
    }
  }
};
