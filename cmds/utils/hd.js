import crypto from 'crypto'
import pkg from 'file-type'
import { promises as fsp } from 'fs'
import os from 'os'
import path from 'path'
import { spawn } from 'child_process'
import fetch from 'node-fetch'

const { fileTypeFromBuffer } = pkg

export default {
  command: ['hd', 'enhance', 'remini'],
  category: 'utils',
  run: async (client, m, { usedPrefix, command }) => {
    try {
      const q = m.quoted || m
      const mime = q?.mimetype || q?.msg?.mimetype || ''

      if (!mime) return m.reply(`《✧》 Responde a una *imagen* con:\n${usedPrefix + command}`)
      if (!/^image\/(jpe?g|png|webp)$/i.test(mime)) return m.reply(`《✧》 El formato *${mime}* no es compatible`)

      const buffer = await q.download?.()
      if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 10) return m.reply('《✧》 No se pudo descargar la imagen')

      const ft = await safeFileType(buffer)
      const inputMime = ft?.mime || mime || 'image/jpeg'
      
      const result = await vectorinkEnhanceFromBuffer(buffer, inputMime)

      if (!result?.ok || !result?.buffer) {
        const msg = result?.error?.code || result?.error?.step || result?.error?.message || 'error'
        return m.reply(`《✧》 No se pudo *mejorar* la imagen (${msg})`)
      }

      await client.sendMessage(m.chat, { image: result.buffer, caption: '✅ *Imagen mejorada con éxito*' }, { quoted: m })
    } catch (e) {
      console.error(e)
      await m.reply(`❌ Error: ${e.message}`)
    }
  }
}

async function safeFileType(buf) {
  try {
    return await fileTypeFromBuffer(buf)
  } catch {
    return null
  }
}

async function safeJson(res) {
  try {
    const t = await res.text()
    return JSON.parse(t)
  } catch {
    return {}
  }
}

function extFromMime(mime) {
  if (/png/i.test(mime)) return 'png'
  if (/webp/i.test(mime)) return 'webp'
  return 'jpg'
}

function runFfmpeg(args, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] })
    let err = ''
    const t = setTimeout(() => {
      try { p.kill('SIGKILL') } catch {}
      reject(new Error('ffmpeg timeout'))
    }, timeoutMs)

    p.stderr.on('data', (d) => (err += d.toString()))
    p.on('error', (e) => {
      clearTimeout(t)
      reject(e)
    })
    p.on('close', (code) => {
      clearTimeout(t)
      if (code === 0) return resolve(true)
      reject(new Error(err || `ffmpeg failed (${code})`))
    })
  })
}

async function webpToPngWithFfmpeg(webpBuf, tmpDir) {
  const inPath = path.join(tmpDir, `vi_${Date.now()}.webp`)
  const outPath = path.join(tmpDir, `vi_${Date.now()}.png`)
  await fsp.writeFile(inPath, webpBuf)
  try {
    await runFfmpeg(['-y', '-i', inPath, '-frames:v', '1', outPath])
    const png = await fsp.readFile(outPath)
    return { ok: true, png }
  } catch (e) {
    return { ok: false, error: e.message }
  } finally {
    try { await fsp.unlink(inPath); await fsp.unlink(outPath) } catch {}
  }
}

async function vectorinkEnhanceFromBuffer(inputBuf, inputMime) {
  const API = 'https://us-central1-vector-ink.cloudfunctions.net/upscaleImage'
  const tmpDir = path.join(os.tmpdir(), 'vectorink')
  const tmpPath = path.join(tmpDir, `img_${Date.now()}.${extFromMime(inputMime)}`)

  try {
    await fsp.mkdir(tmpDir, { recursive: true })
    await fsp.writeFile(tmpPath, inputBuf)
    const b64 = (await fsp.readFile(tmpPath)).toString('base64')

    const r = await fetch(API, {
      method: 'POST',
      headers: { 
        'content-type': 'application/json',
        'user-agent': 'Mozilla/5.0'
      },
      body: JSON.stringify({ data: { image: b64 } })
    })

    const j = await safeJson(r)
    const innerText = j?.result
    if (!innerText) return { ok: false, error: { code: 'no_result' } }

    const inner = JSON.parse(innerText)
    const webpB64 = inner?.image?.b64_json
    if (!webpB64) return { ok: false, error: { code: 'no_b64' } }

    const webpBuf = Buffer.from(webpB64, 'base64')
    return await webpToPngWithFfmpeg(webpBuf, tmpDir)
  } catch (e) {
    return { ok: false, error: { message: e.message } }
  } finally {
    try { await fsp.unlink(tmpPath) } catch {}
  }
}
