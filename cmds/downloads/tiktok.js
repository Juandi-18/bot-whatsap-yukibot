import fetch from 'node-fetch';

export default {
  command: ['tiktok', 'tt', 'tiktoksearch', 'ttsearch', 'tts'],
  category: 'downloader',
  run: async (client, m, args, usedPrefix, command, text) => { // <--- Sin llaves { }
    
    // Verificamos si hay texto para buscar
    if (!text && !args.length) {
      return m.reply(`《✧》 Por favor, ingresa un término de búsqueda o enlace de TikTok. ♡`)
    }

    const query = text || args.join(" ")
    const isUrl = /(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok.com\/([^\s&]+)/gi.test(query)
    
    const endpoint = isUrl 
      ? `${global.APIs.stellar.url}/dl/tiktok?url=${encodeURIComponent(query)}&key=${global.APIs.stellar.key}` 
      : `${global.APIs.stellar.url}/search/tiktok?query=${encodeURIComponent(query)}&key=${global.APIs.stellar.key}`

    try {
      const res = await fetch(endpoint)
      if (!res.ok) throw new Error(`El servidor respondió con ${res.status}`)
      const json = await res.json()
      
      if (!json.status) return m.reply('《✧》 No se encontró contenido válido en TikTok. ♡')

      if (isUrl) {
        const { title, duration, dl, author, stats, created_at, type } = json.data
        if (!dl) return m.reply('《✧》 Enlace inválido o sin contenido descargable. ♡')
        
        const caption = `ㅤ۟∩　ׅ　★ ໌　ׅ　🅣𝗂𝗄𝖳𝗈𝗄 🅓ownload　ׄᰙ\n\n𖣣ֶㅤ֯⌗ ✎  ׄ ⬭ *Título:* ${title || 'Sin título'}\n𖣣ֶㅤ֯⌗ ꕥ  ׄ ⬭ *Autor:* ${author?.nickname || 'Desconocido'}\n𖣣ֶㅤ֯⌗ ✿  ׄ ⬭ *Vistas:* ${(stats?.views || stats?.plays || 0).toLocaleString()}\n𖣣ֶㅤ֯⌗ ☁︎  ׄ ⬭ *Fecha:* ${created_at || 'N/A'}`.trim()

        if (type === 'image') {
          const medias = dl.map(url => ({ type: 'image', data: { url }, caption }))
          return await client.sendAlbumMessage(m.chat, medias, { quoted: m })
        } else {
          const videoUrl = Array.isArray(dl) ? dl[0] : dl
          return await client.sendMessage(m.chat, { video: { url: videoUrl }, caption }, { quoted: m })
        }

      } else {
        // --- BÚSQUEDA LIMITADA A 2 VIDEOS ---
        const validResults = json.data?.filter(v => v.dl)
        if (!validResults || validResults.length === 0) {
          return m.reply('《✧》 No se encontraron resultados. ♡')
        }

        const medias = validResults
          .filter(v => typeof v.dl === 'string' && v.dl.startsWith('http'))
          .slice(0, 2) // Limitamos a 2
          .map(v => {
            const caption = `ㅤ۟∩　ׅ　★ ໌　ׅ　🅣𝗂𝗄𝖳𝗈𝗄 🅓ownload　ׄᰙ\n\n𖣣ֶㅤ֯⌗ ✎  ׄ ⬭ *Título:* ${v.title || 'Sin título'}\n𖣣ֶㅤ֯⌗ ꕥ  ׄ ⬭ *Autor:* ${v.author?.nickname || 'Desconocido'}\n𖣣ֶㅤ֯⌗ ✿  ׄ ⬭ *Vistas:* ${(v.stats?.views || 0).toLocaleString()}`.trim()
            return { type: 'video', data: { url: v.dl }, caption }
          })

        if (medias.length === 0) return m.reply('《✧》 No se pudieron procesar los videos. ♡')

        if (medias.length === 1) {
            return await client.sendMessage(m.chat, { video: { url: medias[0].data.url }, caption: medias[0].caption }, { quoted: m })
        } else {
            return await client.sendAlbumMessage(m.chat, medias, { quoted: m })
        }
      }
    } catch (e) {
      console.error(e)
      return m.reply(`> Error al ejecutar *${usedPrefix + command}*. ♡\n> [Error: *${e.message}*]`)
    }
  },
}
