import fetch from 'node-fetch';

export default {
  command: ['tiktok', 'tt', 'tiktoksearch', 'ttsearch', 'tts'],
  category: 'downloader',
  run: async (client, m, args, usedPrefix, command) => {
    if (!args.length) {
      return m.reply(`《✧》 Por favor, ingresa un término de búsqueda o enlace de TikTok. ♡`)
    }

    const text = args.join(" ")
    const isUrl = /(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok.com\/([^\s&]+)/gi.test(text)
    
    // El filtro FF ya se encarga de bloquear en main.js, así que aquí solo procesamos
    const endpoint = isUrl  ? `${global.APIs.stellar.url}/dl/tiktok?url=${encodeURIComponent(text)}&key=${global.APIs.stellar.key}` : `${global.APIs.stellar.url}/search/tiktok?query=${encodeURIComponent(text)}&key=${global.APIs.stellar.key}`

    try {
      const res = await fetch(endpoint)
      if (!res.ok) throw new Error(`El servidor respondió con ${res.status}`)
      const json = await res.json()
      
      if (!json.status) return m.reply('《✧》 No se encontró contenido válido en TikTok. ♡')

      // 1. SI ES UN ENLACE DIRECTO (1 solo video)
      if (isUrl) {
        const { title, duration, dl, author, stats, created_at, type } = json.data
        if (!dl || (Array.isArray(dl) && dl.length === 0)) return m.reply('《✧》 Enlace inválido o sin contenido descargable. ♡')
        
        const caption = `ㅤ۟∩　ׅ　★ ໌　ׅ　🅣𝗂𝗄𝖳𝗈𝗄 🅓ownload　ׄᰙ\n\n𖣣ֶㅤ֯⌗ ✎  ׄ ⬭ *Título:* ${title || 'Sin título'}\n𖣣ֶㅤ֯⌗ ꕥ  ׄ ⬭ *Autor:* ${author?.nickname || author?.unique_id || 'Desconocido'}\n𖣣ֶㅤ֯⌗ ⴵ  ׄ ⬭ *Duración:* ${duration || 'N/A'}\n𖣣ֶㅤ֯⌗ ❖  ׄ ⬭ *Likes:* ${(stats?.likes || 0).toLocaleString()}\n𖣣ֶㅤ֯⌗ ❀  ׄ ⬭ *Comentarios:* ${(stats?.comments || 0).toLocaleString()}\n𖣣ֶㅤ֯⌗ ✿  ׄ ⬭ *Vistas:* ${(stats?.views || stats?.plays || 0).toLocaleString()}\n𖣣ֶㅤ֯⌗ ☆  ׄ ⬭ *Compartidos:* ${(stats?.shares || 0).toLocaleString()}\n𖣣ֶㅤ֯⌗ ☁︎  ׄ ⬭ *Fecha:* ${created_at || 'N/A'}`.trim()

        if (type === 'image') {
          const medias = dl.map(url => ({ type: 'image', data: { url }, caption }))
          await client.sendAlbumMessage(m.chat, medias, { quoted: m })
          const audioRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(text)}&hd=1`)
          const audioJson = await audioRes.json()
          const audioUrl = audioJson?.data?.play
          if (audioUrl) {
            return await client.sendMessage(m.chat, { audio: { url: audioUrl }, mimetype: 'audio/mp4', fileName: 'tiktok_audio.mp4' }, { quoted: m })
          }
        } else {
          const videoUrl = Array.isArray(dl) ? dl[0] : dl
          return await client.sendMessage(m.chat, { video: { url: videoUrl }, caption }, { quoted: m })
        }

      // 2. SI ES UNA BÚSQUEDA (Aquí está el cambio a 2 videos)
      } else {
        const validResults = json.data?.filter(v => v.dl)
        if (!validResults || validResults.length === 0) {
          return m.reply('《✧》 No se encontraron resultados con videos disponibles. ♡')
        }

        // Aquí limitamos a 2 videos usando .slice(0, 2)
        const medias = validResults.filter(v => typeof v.dl === 'string' && v.dl.startsWith('http')).map(v => {
            const caption = `ㅤ۟∩　ׅ　★ ໌　ׅ　🅣𝗂𝗄𝖳𝗈𝗄 🅓ownload　ׄᰙ\n\n𖣣ֶㅤ֯⌗ ✎  ׄ ⬭ *Título:* ${v.title || 'Sin título'}\n𖣣ֶㅤ֯⌗ ꕥ  ׄ ⬭ *Autor:* ${v.author?.nickname || 'Desconocido'} ${v.author?.unique_id ? `@${v.author.unique_id}` : ''}\n𖣣ֶㅤ֯⌗ ⴵ  ׄ ⬭ *Duración:* ${v.duration || 'N/A'}\n𖣣ֶㅤ֯⌗ ❖  ׄ ⬭ *Likes:* ${(v.stats?.likes || 0).toLocaleString()}\n𖣣ֶㅤ֯⌗ ✿  ׄ ⬭ *Vistas:* ${(v.stats?.views || 0).toLocaleString()}\n𖣣ֶㅤ֯⌗ ❒  ׄ ⬭ *Audio:* ${v.music?.title || 'original sound'}`.trim()
            return { type: 'video', data: { url: v.dl }, caption }
          }).slice(0, 2) // <--- ¡LA MAGIA OCURRE AQUÍ!

        // Si solo encontró 1 video, lo enviamos normal. Si encontró 2, enviamos el álbum.
        if (medias.length === 1) {
            return await client.sendMessage(m.chat, { video: { url: medias[0].data.url }, caption: medias[0].caption }, { quoted: m })
        } else {
            await client.sendAlbumMessage(m.chat, medias, { quoted: m })
        }
      }
    } catch (e) {
      return await m.reply(`> Error inesperado al ejecutar *${usedPrefix + command}*. ♡\n> [Error: *${e.message}*]`)
    }
  },
}
