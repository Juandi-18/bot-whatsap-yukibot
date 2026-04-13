import { startSubBot } from '../../core/subs.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// IMPORTANTE: Esta variable ahora es global para que no se resetee
if (!global.subBotFlags) global.subBotFlags = {}

export default {
    command: ['code', 'qr'],
    category: 'socket',
    run: async (client, m, { args }) => {
        try {
            const sender = m.sender;
            const text = m.text || '';
            const isCode = text.toLowerCase().includes('code');

            // 1. REGISTRO DE USUARIO
            if (!global.db.data.users[sender]) global.db.data.users[sender] = {}
            let user = global.db.data.users[sender]
            
            // Cooldown de 2 minutos
            let time = (user.Subs || 0) + 120000 
            if (new Date() - (user.Subs || 0) < 120000) {
                return client.reply(m.chat, `《✧》 Espera *${msToTime(time - new Date())}* para reintentar. ♡`, m)
            }

            // 2. ACTIVAR BANDERA INDIVIDUAL
            // Guardamos el chat específico de ESTE usuario para que no se cruce con otros
            global.subBotFlags[sender] = {
                active: true,
                chatId: m.chat
            }

            const caption = isCode 
                ? `「✿」*SOLICITUD DE CÓDIGO* ◢\n\n➩ El código llegará en segundos para el número: @${sender.split('@')[0]}`
                : `「✿」*SOLICITUD DE QR* ◢\n\n➩ Escanea el QR que aparecerá abajo.`;

            let phone = args[0] ? args[0].replace(/\D/g, '') : sender.split('@')[0];

            await client.reply(m.chat, caption, m, { mentions: [sender] });
            
            // 3. INICIAR INSTANCIA INDEPENDIENTE
            // Pasamos global.subBotFlags para que el core sepa a quién responder
            await startSubBot(m, client, caption, isCode, phone, m.chat, global.subBotFlags, true)
            
            user.Subs = new Date() * 1
            
        } catch (e) {
            console.error("ERROR MULTI-SUBBOT:", e)
        }
    }
};

function msToTime(duration) {
    let seconds = Math.floor((duration / 1000) % 60)
    let minutes = Math.floor((duration / (1000 * 60)) % 60)
    return `${minutes}m ${seconds}s`
}
