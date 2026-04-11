import yts from 'yt-search'
import fetch from 'node-fetch'
import { getBuffer } from '../../core/message.js'

const isYTUrl = (url) => /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i.test(url)

async function getVideoInfo(query, videoMatch) {
  const search = await yts(query)
  if (!search.all.length) return null
  const videoInfo = videoMatch ? search.videos.find(v => v.videoId === videoMatch[1]) || search.all[0] : search.all[0]
  return videoInfo || null
}

export default {
  command: ['play', 'mp3', 'ytmp3', 'ytaudio', 'playaudio'],
  category: 'downloader',
  run: async (client, m, context) => { // Cambiado a context para mayor estabilidad en YukiBot
    try {
      const args = context.args || []
      const text = context.text || (args.length > 0 ? args.join(' ') : null) || m.text || ''
      const usedPrefix = context.usedPrefix || '!'
      const command = context.command || 'play'

      if (!text || text.trim().length === 0) {
        return m.reply(`《✧》Por favor, menciona el nombre o URL del video que deseas descargar`)
      }

      const videoMatch = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/)
      const query = videoMatch ? 'https://youtu.be/' + videoMatch[1] : text
      let url = query, title = null, thumbBuffer = null

      try {
        const videoInfo = await getVideoInfo(query, videoMatch)
        if (videoInfo) {
          url = videoInfo.url
          title = videoInfo.title
          thumbBuffer = await getBuffer(videoInfo.image)
          const vistas = (videoInfo.views || 0).toLocaleString()
          const canal = videoInfo.author?.name || 'Desconocido'
          
          const infoMessage = `➩ Descargando › ${title}

> ❖ Canal › *${canal}*
> ⴵ Duración › *${videoInfo.timestamp || 'Desconocido'}*
> ❀ Vistas › *${vistas}*
> ✩ Publicado › *${videoInfo.ago || 'Desconocido'}*
> ❒ Enlace › *${url}*`
          
          await client.sendMessage(m.chat, { image: thumbBuffer, caption: infoMessage }, { quoted: m })
        }
      } catch (err) { }

      // --- MOTOR DE DESCARGA ACTUALIZADO ---
      const audio = await getAudioFromApis(url)
      
      if (!audio?.url) {
        return m.reply('《✧》 No se pudo descargar el *audio*. Intenta con otro nombre o un video más corto.')
      }

      // Descarga del buffer con manejo de errores
      const audioBuffer = await getBuffer(audio.url)
      
      await client.sendMessage(m.chat, { 
        audio: audioBuffer, 
        fileName: `${title || 'audio'}.mp3`, 
        mimetype: 'audio/mpeg' 
      }, { quoted: m })

    } catch (e) {
      await m.reply(`> Error en *${usedPrefix + command}*.\n> [Error: *${e.message}*]`)
    }
  }
}

async function getAudioFromApis(url) {
  // APIs probadas que funcionan con proxies para evitar el bloqueo de Codespaces
  const apis = [
    { api: 'Pop-API', endpoint: `https://api.popcat.xyz/itunes?q=${encodeURIComponent(url)}`, extractor: res => res[0]?.preview }, // Alternativa rápida
    { api: 'Cobalt', endpoint: `https://cobalt.sh/api/json`, method: 'POST', body: { url, downloadMode: 'audio' }, extractor: res => res.url },
    { api: 'Siputzx', endpoint: `https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(url)}`, extractor: res => res.data?.dl }
  ]

  for (const { api, endpoint, method, body, extractor } of apis) {
    try {
      console.log(`[Audio] Intentando con: ${api}...`)
      const options = {
        method: method || 'GET',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
        body: body ? JSON.stringify(body) : null
      }
      
      const res = await fetch(endpoint, options).then(r => r.json())
      const link = extractor(res)
      
      if (link) {
        console.log(`✅ ¡Audio conseguido con ${api}!`)
        return { url: link, api }
      }
    } catch (e) {
      console.log(`❌ ${api} falló.`)
    }
  }
  return null
}
