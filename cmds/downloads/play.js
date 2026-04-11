import ytdl from '@distube/ytdl-core'
import yts from 'yt-search'

export default {
    command: ['playaudio', 'musica', 'ytmp3'],
    category: 'downloads',
    run: async (client, m, context) => {
        // --- CAPTURA ROBUSTA DE ARGUMENTOS ---
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

            // Obtenemos info para el tamaño real del archivo
            const info = await ytdl.getInfo(video.url);
            const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
            const size = (format.contentLength / (1024 * 1024)).toFixed(2);

            // TU DISEÑO PERSONALIZADO
            const txt = `「✦」Descargando <${video.title}>\n\n` +
                        `> ✐ Canal » ${video.author.name}\n` +
                        `> ⴵ Duracion » ${video.timestamp}\n` +
                        `> ✰ Calidad: 128 kbps\n` +
                        `> ❒ Tamaño » ${size}MB\n` +
                        `> 🜸 Link » ${video.url}`;

            // Enviamos la miniatura con la info
            await client.sendMessage(m.chat, { image: { url: video.thumbnail }, caption: txt }, { quoted: m });

            // Motor de descarga directa
            const stream = ytdl(video.url, {
                filter: 'audioonly',
                quality: 'highestaudio',
                highWaterMark: 1 << 25 // Buffer para evitar cortes
            });

            // Enviamos el audio directamente a WhatsApp
            await client.sendMessage(m.chat, { 
                audio: { stream }, 
                mimetype: 'audio/mp4', 
                fileName: `${video.title}.mp3` 
            }, { quoted: m });

        } catch (e) {
            console.error(e);
            m.reply('❌ Error al procesar la descarga. YouTube está bloqueando la conexión, intenta de nuevo en un momento.');
        }
    }
}