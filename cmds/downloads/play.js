import yts from 'yt-search'
import fetch from 'node-fetch'
import { getBuffer } from '../../core/message.js'

export default {
  command: ['play', 'mp3', 'ytmp3', 'playaudio'],
  category: 'downloader',
  run: async (client, m, context) => {
    const text = context.text || m.text || (context.args ? context.args.join(' ') : '')
    const usedPrefix = context.usedPrefix || '!'
    const command = context.command || 'play'

    const query = text.replace(usedPrefix + command, '').trim() || text
    if (!query || query.length < 3) return m.reply(`《✧》Escribe el nombre de la canción.\nEjemplo: *${usedPrefix + command}* Lollipop`)

    try {
      const search = await yts(query)
      const video = search.videos[0]
      if (!video) return m.reply('《✧》 No encontré resultados.')

      const { title, thumbnail, timestamp, views, url } = video
      const infoMessage = `➩ Descargando Audio › ${title}\n> ❖ Duración › *${timestamp}*\n> ❀ Vistas › *${views.toLocaleString()}*\n> ❒ Enlace › *${url}*`

      await client.sendMessage(m.chat, { image: { url: thumbnail }, caption: infoMessage }, { quoted: m })

      // Intentar con la lista de APIs más estables para Termux
      const audioUrl = await tryStableApis(url)
      
      if (!audioUrl) return m.reply('《✧》 Todos los servidores están saturados. Intenta con un video más corto o prueba en unos minutos.')

      const buffer = await getBuffer(audioUrl)
      await client.sendMessage(m.chat, { 
        audio: buffer, 
        fileName: `${title}.mp3`, 
        mimetype: 'audio/mpeg'
      }, { quoted: m })

    } catch (e) {
      m.reply(`> Error: ${e.message}`)
    }
  }
}

async function tryStableApis(ytUrl) {
  const endpoints = [
    { url: `https://api.lulu-web.xyz/api/ytmp3?url=${encodeURIComponent(ytUrl)}`, extract: res => res.result?.download },
    { url: `https://api.zenkey.my.id/api/download/ytmp3?url=${encodeURIComponent(ytUrl)}`, extract: res => res.result?.download_url },
    { url: `https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(ytUrl)}`, extract: res => res.data?.dl },
    { url: `https://api.d-as.my.id/api/download/ytmp3?url=${encodeURIComponent(ytUrl)}`, extract: res => res.result?.url }
  ]

  for (const api of endpoints) {
    try {
      console.log(`[Audio] Probando motor: ${api.url.split('/')[2]}`)
      const res = await fetch(api.url).then(r => r.json())
      const link = api.extract(res)
      if (link) return link
    } catch { continue }
  }
  return null
}
