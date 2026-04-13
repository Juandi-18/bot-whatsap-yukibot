import { startSubBot } from '../../core/subs.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
let commandFlags = {}

export default {
    command: ['code', 'qr'],
    category: 'socket',
    run: async (client, m, { args, usedPrefix, command }) => {
        // 1. VERIFICACIÓN DE TIEMPO (Cooldown)
        let user = global.db.data.users[m.sender]
        if (!user) user = global.db.data.users[m.sender] = {}
        
        let time = (user.Subs || 0) + 120000 
        if (new Date() - (user.Subs || 0) < 120000) {
            return client.reply(m.chat, `《✧》 Por favor, espera *${msToTime(time - new Date())}* para solicitar otro código. ♡`, m)
        }

        // 2. VERIFICACIÓN DE ESPACIO (Máximo 50 Sub-Bots)
        const subsPath = path.join(dirname, '../../Sessions/Subs')
        if (!fs.existsSync(subsPath)) fs.mkdirSync(subsPath, { recursive: true })
        
        const subsCount = fs.readdirSync(subsPath).filter((dir) => {
            const credsPath = path.join(subsPath, dir, 'creds.json')
            return fs.existsSync(credsPath)
        }).length

        if (subsCount >= 50) {
            return client.reply(m.chat, '《✧》 Lo siento, no hay espacios disponibles para más Sub-Bots en este momento. ♡', m)
        }

        // 3. DEFINICIÓN DE MENSAJES (Diseño YukiBot)
        const rtx = `「✿」*VINCULACIÓN POR CÓDIGO* ◢\n\n➩ Sigue estos pasos:\n\n1. Click en los *3 puntos* (Android) o *Configuración* (iOS).\n2. Selecciona *Dispositivos vinculados*.\n3. Toca en *Vincular un dispositivo*.\n4. Selecciona *Vincular con el número de teléfono*.\n\nꕤ *Importante:* El código de 8 dígitos llegará en unos segundos abajo de este mensaje. ♡`
        
        const rtx2 = `「✿」*VINCULACIÓN POR QR* ◢\n\n➩ Escanea el código QR que aparecerá a continuación para activar tu Sub-Bot. ꕤ`

        const isCode = /code/i.test(command)
        const caption = isCode ? rtx : rtx2
        
        // Limpiamos el número: debe ser el del remitente o el que pongas como argumento
        const phone = args[0] ? args[0].replace(/\D/g, '') : m.sender.split('@')[0]
        
        // 4. EJECUCIÓN DEL PROCESO
        commandFlags[m.sender] = true
        
        try {
            // Mandamos el aviso primero
            await client.reply(m.chat, caption, m)
            
            // Llamamos a la función del core para generar el código/QR
            // Importante: Pasamos 'true' al final para indicar que es un comando activo
            await startSubBot(m, client, caption, isCode, phone, m.chat, commandFlags, true)
            
            // Guardamos el tiempo del intento
            user.Subs = new Date() * 1
            
        } catch (e) {
            console.error(e)
            client.reply(m.chat, '《✧》 Ocurrió un error al intentar generar el código de vinculación. ♡', m)
        }
    }
};

// --- FUNCIONES DE APOYO ---
function msToTime(duration) {
    let seconds = Math.floor((duration / 1000) % 60)
    let minutes = Math.floor((duration / (1000 * 60)) % 60)
    return `${minutes}m ${seconds}s`
}
