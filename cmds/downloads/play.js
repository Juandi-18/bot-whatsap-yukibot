import yts from 'yt-search'
import axios from 'axios'
import { getBuffer } from '../../core/message.js'

export default {
    command: ['playaudio', 'musica', 'ytmp3'],
    category: 'downloads',
    run: async (client, m, context) => {
        // --- CAPTURA SEGURA DE ARGUMENTOS ---
        const text = context.text || (context.args ? context.args.join(' ') : null) || m.text || '';
        const usedPrefix = context.usedPrefix || '!';
        const command = context.command || 'playaudio';

        if (!text || text.trim().length === 0) {
            return m.reply(`《✧》 ¿Qué canción quieres escuchar?\nEjemplo: *${usedPrefix + command}* Inmortal - Aventura`);
        }

        try {
            const search = await yts(text);
            const video = search.videos[0];
            if (!video) return m.reply('《✧》 No encontré resultados.');

            const url = video.url;
            
            // 1. Buscamos el link de descarga en las APIs
            const data = await getAudioFromApis(url);
            
            if (!data) {
                return m.reply('❌ No se pudo obtener el enlace de descarga. Todas las APIs están saturadas.');
            }

            // 2. Diseño Personalizado
            const infoMessage = `「✦」Descargando <${video.title}>\n\n` +
                                `> ✐ Canal » ${video.author.name}\n` +
                                `> ⴵ Duración » ${video.timestamp}\n` +
                                `> ✰ Calidad: 128 kbps\n` +
                                `> ❒ Tamaño » ${data.size || 'Desconocido'}\n` +
                                `> 🜸 Link » ${url}`;

            await client.sendMessage(m.chat, { image: { url: video.thumbnail }, caption: infoMessage }, { quoted: m });

            // 3. Envío del Audio
            await client.sendMessage(m.chat, { 
                audio: { url: data.url }, 
                mimetype: 'audio/mp4', 
                fileName: `${video.title}.mp3` 
            }, { quoted: m });

        } catch (e) {
            console.error(e);
            m.reply('❌ Error inesperado al procesar la solicitud.');
        }
    }
}

// Función con múltiples APIs (tu método anterior mejorado)
async function getAudioFromApis(url) {
    const apis = [
        { name: 'Axi', endpoint: `https://dark-shan-yt.vercel.app/api/download/ytmp3?url=${encodeURIComponent(url)}`, extractor: res => res.data?.result?.download?.url },
        { name: 'Vreden', endpoint: `https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(url)}`, extractor: res => res.data?.result?.download?.url },
        { name: 'YTDL', endpoint: `https://api.caliph.biz.id/api/ytmp3?url=${encodeURIComponent(url)}`, extractor: res => res.data?.result?.url }
    ];

    for (const api of apis) {
        try {
            const res = await axios.get(api.endpoint, { timeout: 10000 });
            const downloadUrl = api.extractor(res);
            if (downloadUrl) return { url: downloadUrl, size: res.data?.result?.download?.size || null };
        } catch (e) {
            console.log(`API ${api.name} falló, intentando siguiente...`);
        }
    }
    return null;
}
