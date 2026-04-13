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
    run: async (client, m, { args, command }) => { // <--- Aquí simplificamos la entrada
        try {
            // 1. VERIFICACIÓN DE USUARIO Y COOLDOWN
            if (!global.db.data.users[m.sender]) global.db.data.users[m.sender] = {}
            let user = global.db.data.users[m.sender]
            
            let time = (user.Subs || 0) + 120000 
            if (new Date() - (user.Subs || 0) < 120000) {
                return client.reply(m.chat, `《✧》 Por favor, espera *${msToTime(time - new Date())}* para volver a intentar. ♡`, m)
            }

            // 2. VERIFICACIÓN DE CARPETA
            const subsPath = path.join(dirname, '../../Sessions/Subs')
            if (!fs.existsSync(subsPath)) fs.mkdirSync(subsPath, { recursive: true })

            // 3. DEFINICIÓN DE MENSAJES
            const rtx = `「✿」*VINCULACIÓN POR CÓDIGO* ◢\n\n➩ Sigue estos pasos:\n\n1. Ve a *Dispositivos vinculados*.\n2. Toca en *Vincular un dispositivo*.\n3. Selecciona *Vincular con el número de teléfono*.\n\nꕤ *Importante:* El código de 8 dígitos aparecerá abajo. ♡`
            const rtx2 = `「✿」*VINCULACIÓN POR QR* ◢\n\n➩ Escanea el código QR que aparecerá a continuación. ꕤ`

            const isCode = /code/i.test(command)
            const caption = isCode ? rtx : rtx2
            
            // --- CORRECCIÓN DEL ERROR '0' ---
            // Si args existe y tiene contenido, lo usa; si no, usa el número de quien envía el mensaje
            let phone = m.sender.split('@')[0]
            if (args && args.length > 0 && args[0]) {
                phone = args[0].replace(/\D/g, '')
            }
            
            commandFlags[m.sender] = true
            
            // 4. EJECUCIÓN
            await client.reply(m.chat, caption, m)
            
            // Inicia el proceso en subs.js
            await startSubBot(m, client, caption, isCode, phone, m.chat, commandFlags, true)
            
            user.Subs = new Date() * 1
            
        } catch (e) {
            console.error("ERROR EN SUBBOT:", e)
            client.reply(m.chat, '《✧》 Ocurrió un fallo al generar la vinculación. Revisa la consola. ♡', m)
        }
    }
};

function msToTime(duration) {
    let seconds = Math.floor((duration / 1000) % 60)
    let minutes = Math.floor((duration / (1000 * 60)) % 60)
    return `${minutes}m ${seconds}s`
}
