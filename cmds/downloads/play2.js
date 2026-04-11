import ytdl from '@distube/ytdl-core'
import yts from 'yt-search'

export default {
    command: ['play2', 'mp4', 'ytmp4', 'ytvideo', 'playvideo'],
    category: 'downloader',
    run: async (client, m, { text, usedPrefix, command }) => {
        if (!text) return m.reply(`《✧》Por favor, menciona el nombre o URL del video que deseas descargar`)

        try {
            const search = await yts(text)
            const video = search.videos[0]
            if (!video) return m.reply('《✧》 No encontré el video.')

            const url = video.url
            const info = await ytdl.getInfo(url)
            
            // Elegimos calidad 360p (itag 18) para que sea compatible con WhatsApp
            const format = ytdl.chooseFormat(info.formats, { quality: '18' })
            const size = (format.contentLength / (1024 * 1024)).toFixed(2)

            // DISEÑO EXACTO QUE PEDISTE
            const infoMessage = `「✦」Descargando <${video.title}>\n\n` +
                                `> ✐ Canal » ${video.author.name}\n` +
                                `> ⴵ Duracion » ${video.timestamp}\n` +
                                `> ✰ Calidad: 360p\n` +
                                `> ❒ Tamaño » ${size}MB\n` +
                                `> 🜸 Link » ${url}`

            await client.sendMessage(m.chat, { image: { url: video.thumbnail }, caption: infoMessage }, { quoted: m })

            // Motor de descarga directa (Stream)
            const stream = ytdl(url, {
                filter: 'audioandvideo',
                quality: '18',
                highWaterMark: 1 << 25
            })

            // Enviamos el video directamente
            await client.sendMessage(m.chat, { 
                video: { stream }, 
                mimetype: 'video/mp4', 
                fileName: `${video.title}.mp4`,
                caption: `✨ Aquí tienes tu video.`
            }, { quoted: m })

        } catch (e) {
            console.error(e)
            m.reply('❌ Error al procesar el video. YouTube bloqueó la descarga o el archivo es muy pesado.')
        }
    }
}
