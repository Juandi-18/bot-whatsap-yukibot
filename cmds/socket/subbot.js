import { startSubBot } from '../../core/subs.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (!global.subBotFlags) global.subBotFlags = {}

export default {
    command: ['code', 'qr'],
    category: 'socket',
    run: async (client, m, { args }) => {
        try {
            const sender = m.sender;
            const text = m.text || '';
            const isCode = text.toLowerCase().includes('code');

            // 1. REGISTRO Y COOLDOWN
            if (!global.db.data.users[sender]) global.db.data.users[sender] = {}
            let user = global.db.data.users[sender]
            
            let time = (user.Subs || 0) + 120000 
            if (new Date() - (user.Subs || 0) < 120000) {
                return client.reply(m.chat, `《✧》 Espera *${msToTime(time - new Date())}* para reintentar. ♡`, m)
            }

            // 2. EXTRAER EL NÚMERO (Aquí estaba el error)
            // Usamos una validación segura: si args no existe o está vacío, usamos el sender
            let phone = sender.split('@')[0];
            if (args && Array.isArray(args) && args.length > 0 && args[0]) {
                phone = args[0].replace(/\D/g, '');
            }

            // 3. ACTIVAR BANDERA MULTITAREA
            global.subBotFlags[sender] = {
                active: true,
                chatId: m.chat
            }

            const caption = isCode 
                ? `「✿」*SOLICITUD DE CÓDIGO* ◢\n\n➩ El código llegará en segundos para el número: @${phone}\n\n> ꕤ Si no eres tú, usa: *!code número*`
                : `「✿」*SOLICITUD DE QR* ◢\n\n➩ Escanea el QR que aparecerá abajo. ꕤ`;

            await client.reply(m.chat, caption, m, { mentions: [sender, phone + '@s.whatsapp.net'] });
            
            // 4. INICIAR PROCESO
            await startSubBot(m, client, caption, isCode, phone, m.chat, global.subBotFlags, true)
            
            user.Subs = new Date() * 1
            
        } catch (e) {
            console.error("ERROR MULTI-SUBBOT:", e)
            client.reply(m.chat, "《✧》 Ocurrió un error inesperado. Inténtalo de nuevo. ♡", m);
        }
    }
};

function msToTime(duration) {
    let seconds = Math.floor((duration / 1000) % 60)
    let minutes = Math.floor((duration / (1000 * 60)) % 60)
    return `${minutes}m ${seconds}s`
}
