import yts from 'yt-search'
import fetch from 'node-fetch'
import { getBuffer } from '../../core/message.js'

export default {
  command: ['play', 'mp3', 'ytmp3', 'playaudio'],
  category: 'downloader',
  run: async (client, m, { text, args, usedPrefix, command }) => {
    try {
      // 1. Verificación de texto (Fix para el error de "NaN")
      const q = text || (args && args.length > 0 ? args.join(' ') : null)
      if (!q) return m.reply(`《✧》Por favor, menciona el nombre o URL.\nEjemplo: *${usedPrefix + command}* Lolipop`)

      // 2. Búsqueda en YouTube
      const search = await yts(q)
      const video = search.videos[0]
      if (!video) return m.reply('《✧》 No se encontró el video.')

      const { title, thumbnail, timestamp, views, ago, url } = video
      
      // 3. Mensaje de información (Manteniendo tu estética)
      const infoMessage = `➩ Descargando › ${title}
> ❖ Duración › *${timestamp}*
> ❀ Vistas › *${views.toLocaleString()}*
> ✩ Publicado › *${ago}*
> ❒ Enlace › *${url}*`

      await client.sendMessage(m.chat, { image: { url: thumbnail }, caption: infoMessage }, { quoted: m })

      // 4. Descarga usando API Externa (Para saltar el bloqueo de Codespaces)
      const audioUrl = await getAudioUrl(url)
      if (!audioUrl) return m.reply('《✧》 No se pudo obtener el audio, intenta con otro nombre.')

      const buffer = await getBuffer(audioUrl)
      await client.sendMessage(m.chat, { 
        audio: buffer, 
        fileName: `${title}.mp3`, 
        mimetype: 'audio/mpeg' 
      }, { quoted: m })

    } catch (e) {
      console.error(e)
      m.reply(`> Error inesperado: ${e.message}`)
    }
  }
}

// Función con APIs externas que funcionan hoy
async function getAudioUrl(ytUrl) {
  const apis = [
    `https://api.zenkey.my.id/api/download/ytmp3?url=${encodeURIComponent(ytUrl)}`,
    `https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(ytUrl)}`,
    `https://api.d-as.my.id/api/download/ytmp3?url=${encodeURIComponent(ytUrl)}`
  ]

  for (const api of apis) {
    try {
      const res = await fetch(api).then(r => r.json())
      const link = res.result?.download_url || res.data?.dl || res.result?.url
      if (link) return link
    } catch (e) {
      continue
    }
  }
  return null
}
