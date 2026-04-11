import yts from 'yt-search'
import fetch from 'node-fetch'
import { getBuffer } from '../../core/message.js'

export default {
  command: ['play2', 'mp4', 'ytmp4', 'playvideo'],
  category: 'downloader',
  run: async (client, m, context) => {
    // Sistema robusto de lectura de texto
    const text = context.text || m.text || (context.args ? context.args.join(' ') : '')
    const usedPrefix = context.usedPrefix || '!'
    const command = context.command || 'play2'

    // Limpiamos el texto para obtener solo la búsqueda
    const query = text.replace(usedPrefix + command, '').trim() || text
    
    if (!query || query.length < 3) {
      return m.reply(`《✧》Por favor, menciona el nombre o URL.\nEjemplo: *${usedPrefix + command}* Lolipop Remix`)
    }

    try {
      const search = await yts(query)
      const video = search.videos[0]
      if (!video) return m.reply('《✧》 No se encontró nada con ese nombre.')

      const { title, thumbnail, timestamp, views, url } = video
      const infoMessage = `➩ Descargando Video › ${title}\n> ❖ Duración › *${timestamp}*\n> ❀ Vistas › *${views.toLocaleString()}*\n> ❒ Enlace › *${url}*`

      await client.sendMessage(m.chat, { image: { url: thumbnail }, caption: infoMessage }, { quoted: m })

      // Intentar descargar con múltiples APIs si una falla
      const videoUrl = await tryMultipleApis(url)
      
      if (!videoUrl) {
        return m.reply('《✧》 Todos los servidores de video están caídos en este momento. Intenta de nuevo en unos minutos.')
      }

      await client.sendMessage(m.chat, { 
        video: { url: videoUrl }, 
        fileName: `${title}.mp4`, 
        mimetype: 'video/mp4'
      }, { quoted: m })

    } catch (e) {
      m.reply(`> Error crítico: ${e.message}`)
    }
  }
}

async function tryMultipleApis(ytUrl) {
  // Lista de APIs de respaldo (Actualizadas 2026)
  const endpoints = [
    { url: `https://api.siputzx.my.id/api/d/ytmp4?url=${encodeURIComponent(ytUrl)}`, extract: res => res.data?.dl },
    { url: `https://api.d-as.my.id/api/download/ytmp4?url=${encodeURIComponent(ytUrl)}`, extract: res => res.result?.url },
    { url: `https://dark-shan-yt.vercel.app/api/download/ytmp4?url=${encodeURIComponent(ytUrl)}`, extract: res => res.result?.download?.url },
    { url: `https://api.zenkey.my.id/api/download/ytmp4?url=${encodeURIComponent(ytUrl)}`, extract: res => res.result?.download_url }
  ]

  for (const api of endpoints) {
    try {
      console.log(`Intentando descargar de: ${api.url}`)
      const response = await fetch(api.url)
      if (!response.ok) continue
      
      const data = await response.json()
      const link = api.extract(data)
      
      if (link) return link
    } catch (err) {
      console.log(`Fallo en una API, saltando a la siguiente...`)
      continue
    }
  }
  return null
}
