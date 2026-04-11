import yts from 'yt-search'
import fetch from 'node-fetch'
import { getBuffer } from '../../core/message.js'

export default {
  command: ['play2', 'mp4', 'ytmp4', 'ytvideo', 'playvideo'],
  category: 'downloader',
  run: async (client, m, { text, args, usedPrefix, command }) => {
    try {
      // 1. Captura de texto (Evita el error de "NaN" y "menciona el nombre")
      const q = text || (args && args.length > 0 ? args.join(' ') : null)
      if (!q) return m.reply(`《✧》Por favor, menciona el nombre o URL del video.\nEjemplo: *${usedPrefix + command}* Lolipop Remix`)

      // 2. Búsqueda en YouTube
      const search = await yts(q)
      const video = search.videos[0]
      if (!video) return m.reply('《✧》 No se encontró el video.')

      const { title, thumbnail, timestamp, views, ago, url } = video
      
      // 3. Mensaje informativo previo
      const infoMessage = `➩ Descargando Video › ${title}
> ❖ Duración › *${timestamp}*
> ❀ Vistas › *${views.toLocaleString()}*
> ✩ Publicado › *${ago}*
> ❒ Enlace › *${url}*`

      await client.sendMessage(m.chat, { image: { url: thumbnail }, caption: infoMessage }, { quoted: m })

      // 4. Obtención del enlace de descarga (MP4)
      const videoUrl = await getVideoUrl(url)
      if (!videoUrl) return m.reply('《✧》 No se pudo obtener el video. Los servidores externos están saturados.')

      // 5. Envío del video (Usamos URL directa para no saturar la RAM de tu Codespace)
      await client.sendMessage(m.chat, { 
        video: { url: videoUrl }, 
        fileName: `${title}.mp4`, 
        mimetype: 'video/mp4',
        caption: `✨ Aquí tienes tu video: *${title}*`
      }, { quoted: m })

    } catch (e) {
      console.error(e)
      m.reply(`> Error inesperado en video: ${e.message}`)
    }
  }
}

// Motores de descarga MP4 actualizados para saltar bloqueos de Codespaces
async function getVideoUrl(ytUrl) {
  const apis = [
    `https://api.zenkey.my.id/api/download/ytmp4?url=${encodeURIComponent(ytUrl)}`,
    `https://api.siputzx.my.id/api/d/ytmp4?url=${encodeURIComponent(ytUrl)}`,
    `https://api.d-as.my.id/api/download/ytmp4?url=${encodeURIComponent(ytUrl)}`
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
