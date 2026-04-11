import axios from "axios"
import FormData from "form-data"

// Función para formatear el tamaño del archivo
function formatBytes(bytes) {
  if (bytes === 0) return "0 B"
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`
}

// Genera un nombre de archivo único para evitar errores en el servidor
function generateUniqueFilename(mime) {
  const ext = mime.split("/")[1] || "bin"
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let id = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  return `${id}.${ext}`
}

async function uploadCatbox(buffer, mime) {
  const form = new FormData()
  form.append("reqtype", "fileupload")
  form.append("fileToUpload", buffer, { filename: generateUniqueFilename(mime) })
  const res = await axios.post("https://catbox.moe/user/api.php", form, {
    headers: form.getHeaders()
  })
  return res.data
}

async function uploadUguu(buffer) {
  const form = new FormData()
  form.append("files[]", buffer, generateUniqueFilename("image/jpeg"))
  const res = await axios.post("https://uguu.se/upload.php", form, {
    headers: form.getHeaders()
  })
  return res.data?.files?.[0]?.url
}

async function uploadQuax(buffer, mime) {
  const form = new FormData()
  form.append("file", buffer, { filename: generateUniqueFilename(mime), contentType: mime })
  const res = await axios.post("https://qu.ax/upload.php", form, {
    headers: form.getHeaders()
  })
  return res.data?.files?.[0]?.url
}

async function uploadAuto(buffer, mime) {
  try {
    return { link: await uploadCatbox(buffer, mime), server: "catbox" }
  } catch {
    try {
      return { link: await uploadQuax(buffer, mime), server: "quax" }
    } catch {
      return { link: await uploadUguu(buffer), server: "uguu" }
    }
  }
}

export default {
  command: ["tourl"],
  category: "utils",
  run: async (client, m, { args, usedPrefix, command }) => {
    const q = m.quoted || m
    const mime = (q.msg || q).mimetype || ""
    
    if (!mime) {
      return m.reply(`✿ Responde a una imagen o video con *${usedPrefix + command}* para convertirlo en URL.`)
    }

    try {
      const media = await q.download()
      if (!media) return m.reply("ꕥ No se pudo descargar el archivo.")

      const serverArg = args[0]?.toLowerCase() || "auto"
      let link, server

      if (serverArg === "catbox") {
        link = await uploadCatbox(media, mime)
        server = "catbox"
      } else if (serverArg === "uguu") {
        link = await uploadUguu(media)
        server = "uguu"
      } else if (serverArg === "quax") {
        link = await uploadQuax(media, mime)
        server = "quax"
      } else {
        const autoRes = await uploadAuto(media, mime)
        link = autoRes.link
        server = autoRes.server
      }

      const userName = m.pushName || "Usuario"
      const texto = `𖹭 ❀ *Upload To ${server.toUpperCase()}*\n\n` +
        `ׅ  ׄ  ✿   ׅ り *Link ›* ${link}\n` +
        `ׅ  ׄ  ✿   ׅ り *Peso ›* ${formatBytes(media.length)}\n` +
        `ׅ  ׄ  ✿   ׅ り *Tipo ›* ${mime.split("/")[1].toUpperCase()}\n` +
        `ׅ  ׄ  ✿   ׅ り *Solicitado por ›* ${userName}`

      return m.reply(texto)
    } catch (e) {
      console.error(e)
      await m.reply(`❌ Error al subir: ${e.message}`)
    }
  }
}
