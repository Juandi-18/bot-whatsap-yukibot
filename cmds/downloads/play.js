import yts from 'yt-search'
import fetch from 'node-fetch'
import { getBuffer } from '../../core/message.js'

export default {
  command: ['play', 'mp3', 'ytmp3', 'playaudio'],
  category: 'downloader',
  run: async (client, m, context) => {
    // Esta línea asegura que el bot lea el texto sin importar cómo lo envíe tu sistema
    const text = context.text || m.text || (context.args ? context.args.join(' ') : '')
    const usedPrefix = context.usedPrefix || '!'
    const command = context.command || 'play'

    if (!text || text.includes(command)) {
      // Si el texto está vacío o solo contiene el comando, pedimos el nombre
      const searchTag = text.replace(usedPrefix + command, '').trim()
      if (!searchTag) return m.reply(`《✧》Por favor, menciona el nombre o URL.\nEjemplo: *${usedPrefix + command}* Lolipop`)
    }

    try {
      const search = await yts(text)
      const video = search.videos[0]
      if (!video) return m.reply('《✧》 No se encontró el video.')

      const { title, thumbnail, timestamp, views, ago, url } = video
      const infoMessage = `➩ Descargando › ${title}\n> ❖ Duración › *${timestamp}*\n> ❀ Vistas › *${views.toLocaleString()}*\n> ✩ Publicado › *${ago}*\n> ❒ Enlace › *${url}*`

      await client.sendMessage(m.chat, { image: { url: thumbnail }, caption: infoMessage }, { quoted: m })

      // Descarga usando API externa
      const res = await fetch(`https://api.zenkey.my.id/api/download/ytmp3?url=${encodeURIComponent(url)}`).then(r => r.json())
      const downloadUrl = res.result?.download_url || res.data?.dl

      if (!downloadUrl) return m.reply('《✧》 El servidor de descarga no respondió. Intenta más tarde.')

      const buffer = await getBuffer(downloadUrl)
      await client.sendMessage(m.chat, { audio: buffer, fileName: `${title}.mp3`, mimetype: 'audio/mpeg' }, { quoted: m })

    } catch (e) {
      m.reply(`> Error: ${e.message}`)
    }
  }
}
