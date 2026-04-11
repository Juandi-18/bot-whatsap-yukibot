import yts from 'yt-search';
import { getBuffer } from '../../core/message.js';

export default {
    command: ['ytsearch', 'search', 'yts'],
    category: 'internet',
    run: async (client, m, { text, usedPrefix, command }) => {
        if (!text) return m.reply(`《✧》 Por favor, ingresa el título de un video o canal.\nEjemplo: *${usedPrefix + command}* Inmortal Aventura`);

        try {
            const search = await yts(text);
            const results = search.all.slice(0, 5); // Mostramos solo los primeros 5 para no saturar
            
            if (results.length === 0) return m.reply('《✧》 No encontré resultados para tu búsqueda.');

            const firstImage = await getBuffer(results[0].image);

            let teks2 = results.map((v) => {
                if (v.type === 'video') {
                    return `「✦」 VIDEO: <${v.title}>\n\n` +
                           `> ✐ Canal » ${v.author.name}\n` +
                           `> ⴵ Duración » ${v.timestamp}\n` +
                           `> ✿ Vistas » ${v.views}\n` +
                           `> 🜸 Link » ${v.url}`;
                } else if (v.type === 'channel') {
                    return `「✦」 CANAL: <${v.name}>\n\n` +
                           `> ❀ Subs » ${v.subCountLabel}\n` +
                           `> ✿ Videos » ${v.videoCount}\n` +
                           `> 🜸 Link » ${v.url}`;
                }
            }).filter((v) => v).join('\n\n╾۪〬─ ┄۫╌ ׄ┄┈۪ ─〬 ׅ┄╌ ۫┈ ─ׄ─۪〬 ┈ ┄۫╌ ┈┄۪ ─ׄ〬╼\n\n');

            const header = `✨ *RESULTADOS DE BÚSQUEDA* ✨\n\n`;

            await client.sendMessage(m.chat, { 
                image: firstImage, 
                caption: header + teks2 
            }, { quoted: m });

        } catch (e) {
            console.error(e);
            m.reply(`❌ Ocurrió un error al buscar: ${e.message}`);
        }
    },
};
