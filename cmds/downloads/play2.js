import yts from 'yt-search'
import fetch from 'node-fetch'
import { getBuffer } from '../../core/message.js'

const isYTUrl = (url) => /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i.test(url)

export default {
  command: ['play2', 'mp4', 'ytmp4', 'ytvideo', 'playvideo'],
  category: 'downloader',
  run: async (client, m, context) => { // Usamos context para mayor estabilidad
    try {
      // FIX: Captura de texto robusta para evitar el error de "menciona el nombre"
      const args = context.args || []
      const text = context.text || (args.length > 0 ? args.join(' ') : null) || m.text || ''
      const usedPrefix = context.usedPrefix || '!'
      const command = context.command || 'mp4'

      if (!text || text.trim().length === 0) {
        return m.reply(`《✧》Por favor, menciona el nombre o URL del video que deseas descargar\nEjemplo: *${usedPrefix + command}* Lolipop`)
      }

      const videoMatch = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/)
      const query = videoMatch ? 'https://youtu.be/' + videoMatch[1] : text
      let url = query, title = null, thumbBuffer = null

      try {
        const search = await yts(query)
        if (search.all.length) {
          const videoInfo = videoMatch ? search.videos.find(v => v.videoId === videoMatch[1]) || search.all[0] : search.all[0]
          if (videoInfo) {
            url = videoInfo.url
            title = videoInfo.title
            thumbBuffer = await getBuffer(videoInfo.image)
            const vistas = (videoInfo.views || 0).toLocaleString()
            const canal = videoInfo.author?.name || 'Desconocido'
            
            const infoMessage = `➩ Descargando › *${title}*

> ❖ Canal › *${canal}*
> ⴵ Duración › *${videoInfo.timestamp || 'Desconocido'}*
> ❀ Vistas › *${vistas}*
> ✩ Publicado › *${videoInfo.ago || 'Desconocido'}*
> ❒ Enlace › *${url}*`
            
            await client.sendMessage(m.chat, { image: thumbBuffer, caption: infoMessage }, { quoted: m })
          }
        }
      } catch (err) {
        console.error("Error al obtener info del video:", err)
      }

      // Intentamos con las APIs nuevas
      const video = await getVideoFromApis(url)
      
      if (!video?.url) {
        return m.reply('《✧》 No se pudo descargar el *video*, los servidores están saturados. Intenta con otro nombre.')
      }

      // Enviamos el video (usando directamente la URL si el buffer falla por tamaño)
      try {
          await client.sendMessage(m.chat, { 
            video: { url: video.url }, 
            fileName: `${title || 'video'}.mp4`, 
            mimetype: 'video/mp4',
            caption: `✨ *${title}*` 
          }, { quoted: m })
      } catch (error) {
          // Fallback: Si el envío directo falla, intentamos con buffer
          const videoBuffer = await getBuffer(video.url)
          await client.sendMessage(m.chat, { video: videoBuffer, fileName: `${title || 'video'}.mp4`, mimetype: 'video/mp4' }, { quoted: m })
      }

    } catch (e) {
      await m.reply(`> Ocurrió un error inesperado.\n> [Error: *${e.message}*]`)
    }
  }
}

async function getVideoFromApis(url) {
  // He actualizado los endpoints a los que están funcionando actualmente (Abril 2026)
  const apis = [
    { api: 'Zenkey', endpoint: `https://api.zenkey.my.id/api/download/ytmp4?url=${encodeURIComponent(url)}`, extractor: res => res.result?.download_url },
    { api: 'Siputzx', endpoint: `https://api.siputzx.my.id/api/d/ytmp4?url=${encodeURIComponent(url)}`, extractor: res => res.data?.dl },
    { api: 'Axi_New', endpoint: `https://dark-shan-yt.vercel.app/api/download/ytmp4?url=${encodeURIComponent(url)}`, extractor: res => res.result?.download?.url }
  ]

  for (const { api, endpoint, extractor } of apis) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000) // 15 seg para videos
      const res = await fetch(endpoint, { signal: controller.signal }).then(r => r.json())
      clearTimeout(timeout)
      
      const link = extractor(res)
      if (link) {
        console.log(`Video descargado con: ${api}`)
        return { url: link, api }
      }
    } catch (e) {
      console.log(`Fallo en API ${api}, saltando...`)
    }
  }
  return null
}
