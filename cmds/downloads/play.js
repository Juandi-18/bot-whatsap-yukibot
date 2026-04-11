import axios from 'axios'
import yts from 'yt-search'

export default {
    command: ['playaudio', 'musica', 'ytmp3'],
    category: 'downloads',
    run: async (client, m, context) => {
        const text = context.text || (context.args ? context.args.join(' ') : null) || m.text || '';
        const usedPrefix = context.usedPrefix || '!';
        const command = context.command || 'playaudio';

        if (!text || text.trim().length === 0) {
            return m.reply(`《✧》 ¿Que canción quieres escuchar?\nEjemplo: *${usedPrefix + command}* Inmortal - Aventura`);
        }

        try {
            const search = await yts(text);
            const video = search.videos[0];
            if (!video) return m.reply('《✧》 No encontré la canción.');

            // Usamos una API externa para evitar el bloqueo de YouTube "Sign in to confirm"
            const res = await axios.get(`https://api.vreden.web.id/api/ytmp3?url=${video.url}`);
            const downloadUrl = res.data.result.download.url;
            const size = res.data.result.download.size;

            const txt = `「✦」Descargando <${video.title}>\n\n` +
                        `> ✐ Canal » ${video.author.name}\n` +
                        `> ⴵ Duracion » ${video.timestamp}\n` +
                        `> ✰ Calidad: 128 kbps\n` +
                        `> ❒ Tamaño » ${size}\n` +
                        `> 🜸 Link » ${video.url}`;

            await client.sendMessage(m.chat, { image: { url: video.thumbnail }, caption: txt }, { quoted: m });

            // Enviamos el audio
            await client.sendMessage(m.chat, { 
                audio: { url: downloadUrl }, 
                mimetype: 'audio/mp4', 
                fileName: `${video.title}.mp3` 
            }, { quoted: m });

        } catch (e) {
            console.error(e);
            m.reply('❌ Error: Las APIs de descarga están saturadas. Intenta con otro nombre o más tarde.');
        }
    }
}
