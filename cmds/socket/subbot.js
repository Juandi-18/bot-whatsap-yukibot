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
    run: async (client, m, { args, command }) => {
        try {
            // 1. INICIALIZAR USUARIO Y COOLDOWN
            if (!global.db.data.users[m.sender]) global.db.data.users[m.sender] = {}
            let user = global.db.data.users[m.sender]
            
            let time = (user.Subs || 0) + 120000 
            if (new Date() - (user.Subs || 0) < 120000) {
                return client.reply(m.chat, `《✧》 Por favor, espera *${msToTime(time - new Date())}* para volver a intentar. ♡`, m)
            }

            // 2. DETECCIÓN DE INTENCIÓN (QR o CODE)
            // Si el comando es 'code', isCode será true. Si es 'qr', será false.
            const isCode = /code/i.test(command) 

            // 3. MENSAJES PERSONALIZADOS
            const rtxCode = `「✿」*SOLICITUD DE CÓDIGO* ◢\n\n➩ *Paso a paso:*\n1. Ve a *Dispositivos vinculados*.\n2. Toca *Vincular un dispositivo*.\n3. Selecciona *Vincular con el número de teléfono*.\n\nꕤ *Importante:* Tu código de 8 dígitos aparecerá debajo de este mensaje en unos instantes. ♡`
            
            const rtxQr = `「✿」*SOLICITUD DE QR* ◢\n\n➩ *Instrucciones:*\n1. Ve a *Dispositivos vinculados*.\n2. Escanea el código QR que aparecerá a continuación para activar tu Sub-Bot. ꕤ`

            const caption = isCode ? rtxCode : rtxQr
            
            // 4. PREPARAR EL NÚMERO
            let phone = m.sender.split('@')[0]
            if (args && args.length > 0 && args[0]) {
                phone = args[0].replace(/\D/g, '')
            }
            
            // 5. EJECUCIÓN
            commandFlags[m.sender] = true
            
            // Enviamos el mensaje de texto primero
            await client.reply(m.chat, caption, m)
            
            // Llamamos a startSubBot pasando 'isCode' correctamente
            // Si isCode es true -> Mandará el código de 8 dígitos
            // Si isCode es false -> Mandará la imagen del QR
            await startSubBot(m, client, caption, isCode, phone, m.chat, commandFlags, true)
            
            user.Subs = new Date() * 1
            
        } catch (e) {
            console.error("ERROR EN SUBBOT:", e)
            client.reply(m.chat, '《✧》 Ocurrió un fallo al intentar procesar la vinculación. ♡', m)
        }
    }
};

function msToTime(duration) {
    let seconds = Math.floor((duration / 1000) % 60)
    let minutes = Math.floor((duration / (1000 * 60)) % 60)
    return `${minutes}m ${seconds}s`
}
