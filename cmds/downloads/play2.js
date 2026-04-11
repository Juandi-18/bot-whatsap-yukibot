import ytdl from '@distube/ytdl-core'
import yts from 'yt-search'

export default {
    command: ['play2', 'mp4', 'ytmp4', 'ytvideo', 'playvideo'],
    category: 'downloader',
    run: async (client, m, context) => {
        // --- CAPTURA SEGURA DE ARGUMENTOS ---
        const text = context.text || (context.args ? context.args.join(' ') : null) || m.text || '';
        const usedPrefix = context.usedPrefix || '!';
        const command = context.command || 'mp4';

        if (!text || text.trim().length === 0) {
            return m.reply(`《✧》 Por favor, menciona el nombre o URL del video que deseas descargar\nEjemplo: *${usedPrefix + command}* Lolipop`);
        }

        try {
            const search = await yts(text);
            const video = search.videos[0];
            if (!video) return m.reply('《✧》 No encontré el video.');

            const url = video.url;
            const info = await ytdl.getInfo(url);
            
            // Forzamos calidad 360p (itag 18) para evitar que WhatsApp rechace el archivo por peso
            const format = ytdl.chooseFormat(info.formats, { quality: '18' });
            const size = (format.contentLength / (1024 * 1024)).toFixed(2);

            // TU DISEÑO PERSONALIZADO
            const infoMessage = `「✦」Descargando <${video.title}>\n\n` +
                                `> ✐ Canal » ${video.author.name}\n` +
                                `> ⴵ Duracion » ${video.timestamp}\n` +
                                `> ✰ Calidad: 360p\n` +
                                `> ❒ Tamaño » ${size}MB\n` +
                                `> 🜸 Link » ${url}`;

            await client.sendMessage(m.chat, { image: { url: video.thumbnail }, caption: infoMessage }, { quoted: m });

            // Motor de descarga directa (Stream)
            const stream = ytdl(url, {
                filter: 'audioandvideo',
                quality: '18',
                highWaterMark: 1 << 25
            });

            // Enviamos el video directamente
            await client.sendMessage(m.chat, { 
                video: { stream }, 
                mimetype: 'video/mp4', 
                fileName: `${video.title}.mp4`,
                caption: `✨ Aquí tienes tu video.`
            }, { quoted: m });

        } catch (e) {
            console.error(e);
            m.reply('❌ Error al procesar el video. Puede que YouTube haya bloqueado la conexión o el video sea demasiado largo.');
        }
    }
}