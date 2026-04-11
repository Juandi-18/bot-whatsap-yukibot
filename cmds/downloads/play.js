import yts from 'yt-search'
import fetch from 'node-fetch'
import { getBuffer } from '../../core/message.js'

export default {
  command: ['play', 'mp3', 'ytmp3', 'playaudio'],
  category: 'downloader',
  run: async (client, m, context) => {
    // Sistema robusto de lectura de texto para YukiBot
    const text = context.text || m.text || (context.args ? context.args.join(' ') : '')
    const usedPrefix = context.usedPrefix || '!'
    const command = context.command || 'play'

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
      const infoMessage = `➩ Descargando Audio › ${title}\n> ❖ Duración › *${timestamp}*\n> ❀ Vistas › *${views.toLocaleString()}*\n> ❒ Enlace › *${url}*`

      await client.sendMessage(m.chat, { image: { url: thumbnail }, caption: infoMessage }, { quoted: m })

      // Intentar descargar con múltiples APIs de audio
      const audioUrl = await tryMultipleAudioApis(url)
      
      if (!audioUrl) {
        return m.reply('《✧》 Todos los servidores de audio están saturados. Intenta de nuevo en unos minutos.')
      }

      // Descargamos el buffer para enviarlo como archivo de audio real
      const buffer = await getBuffer(audioUrl)

      await client.sendMessage(m.chat, { 
        audio: buffer, 
        fileName: `${title}.mp3`, 
        mimetype: 'audio/mpeg'
      }, { quoted: m })

    } catch (e) {
      m.reply(`> Error crítico en audio: ${e.message}`)
    }
  }
}

async function tryMultipleAudioApis(ytUrl) {
  // Lista de APIs de audio (MP3) de respaldo
  const endpoints = [
    { url: `https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(ytUrl)}`, extract: res => res.data?.dl },
    { url: `https://api.d-as.my.id/api/download/ytmp3?url=${encodeURIComponent(ytUrl)}`, extract: res => res.result?.url },
    { url: `https://dark-shan-yt.vercel.app/api/download/ytmp3?url=${encodeURIComponent(ytUrl)}`, extract: res => res.result?.download?.url },
    { url: `https://api.zenkey.my.id/api/download/ytmp3?url=${encodeURIComponent(ytUrl)}`, extract: res => res.result?.download_url }
  ]

  for (const api of endpoints) {
    try {
      console.log(`[Audio] Intentando descargar de: ${api.url}`)
      const response = await fetch(api.url)
      if (!response.ok) continue
      
      const data = await response.json()
      const link = api.extract(data)
      
      if (link) return link
    } catch (err) {
      console.log(`[Audio] Falló una API, probando la siguiente...`)
      continue
    }
  }
  return null
}
