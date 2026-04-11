import ytdl from '@distube/ytdl-core'
import yts from 'yt-search'

export default {
    command: ['playaudio', 'musica', 'ytmp3'],
    category: 'downloads',
    run: async (client, m, { text, usedPrefix, command }) => {
        if (!text) return m.reply(`《✧》 ¿Que canción quieres escuchar?\nEjemplo: *${usedPrefix + command}* Inmortal - Aventura`)

        try {
            const search = await yts(text)
            const video = search.videos[0]
            if (!video) return m.reply('《✧》 No encontré la canción.')

            // Obtenemos info del video para el tamaño (aproximado)
            const info = await ytdl.getInfo(video.url)
            const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' })
            const size = (format.contentLength / (1024 * 1024)).toFixed(2) // Tamaño en MB

            const txt = `「✦」Descargando <${video.title}>\n\n` +
                        `> ✐ Canal » ${video.author.name}\n` +
                        `> ⴵ Duracion » ${video.timestamp}\n` +
                        `> ✰ Calidad: 128 kbps\n` +
                        `> ❒ Tamaño » ${size}MB\n` +
                        `> 🜸 Link » ${video.url}`

            await client.sendMessage(m.chat, { image: { url: video.thumbnail }, caption: txt }, { quoted: m })

            const stream = ytdl(video.url, {
                filter: 'audioonly',
                quality: 'highestaudio',
                highWaterMark: 1 << 25
            })

            await client.sendMessage(m.chat, { 
                audio: { stream }, 
                mimetype: 'audio/mp4', 
                fileName: `${video.title}.mp3` 
            }, { quoted: m })

        } catch (e) {
            console.error(e)
            m.reply('❌ Error al procesar la descarga.')
        }
    }
}