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
    run: async (client, m, { args }) => { // Quitamos 'command' de aquí para evitar el error
        try {
            if (!global.db.data.users[m.sender]) global.db.data.users[m.sender] = {}
            let user = global.db.data.users[m.sender]
            
            let time = (user.Subs || 0) + 120000 
            if (new Date() - (user.Subs || 0) < 120000) {
                return client.reply(m.chat, `《✧》 Espera *${msToTime(time - new Date())}* para reintentar. ♡`, m)
            }

            // --- SOLUCIÓN AL ERROR: Detectamos el comando directamente del texto ---
            // Esto evita que el bot se rompa si 'command' llega vacío
            const text = m.text || '';
            const isCode = text.toLowerCase().includes('code'); 

            const rtxCode = `「✿」*SOLICITUD DE CÓDIGO* ◢\n\n➩ *Instrucciones:*\n1. Ve a *Dispositivos vinculados*.\n2. Toca *Vincular con el número de teléfono*.\n\nꕤ *Importante:* Tu código llegará en unos segundos. ♡`;
            const rtxQr = `「✿」*SOLICITUD DE QR* ◢\n\n➩ *Instrucciones:*\n1. Escanea el código QR que aparecerá a continuación. ꕤ`;

            const caption = isCode ? rtxCode : rtxQr;
            
            let phone = m.sender.split('@')[0]
            if (args && args.length > 0 && args[0]) {
                phone = args[0].replace(/\D/g, '')
            }
            
            commandFlags[m.sender] = true
            await client.reply(m.chat, caption, m)
            
            // Enviamos los datos al core (subs.js)
            await startSubBot(m, client, caption, isCode, phone, m.chat, commandFlags, true)
            
            user.Subs = new Date() * 1
            
        } catch (e) {
            console.error("ERROR EN SUBBOT:", e)
            client.reply(m.chat, '《✧》 Error al procesar la vinculación. Revisa la consola. ♡', m)
        }
    }
};

function msToTime(duration) {
    let seconds = Math.floor((duration / 1000) % 60)
    let minutes = Math.floor((duration / (1000 * 60)) % 60)
    return `${minutes}m ${seconds}s`
}
