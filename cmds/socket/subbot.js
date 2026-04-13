import { startSubBot } from '../../core/subs.js';
import fs from 'fs';
import path from 'path';

if (!global.subBotFlags) global.subBotFlags = {}

export default {
    command: ['code', 'qr'],
    category: 'socket',
    run: async (client, m, args, usedPrefix, command) => { // Recibe command directamente
        try {
            const sender = m.sender;
            // Usamos 'command' que ya viene limpio de tu main.js
            const isCode = command.includes('code');

            if (!global.db.data.users[sender]) global.db.data.users[sender] = {}
            let user = global.db.data.users[sender];
            
            let time = (user.Subs || 0) + 120000 
            if (new Date() - (user.Subs || 0) < 120000) {
                return client.reply(m.chat, `《✧》 Espera un momento para reintentar. ♡`, m);
            }

            let phone = sender.split('@')[0];
            if (args && args[0]) phone = args[0].replace(/\D/g, '');

            global.subBotFlags[sender] = { active: true, chatId: m.chat };

            const caption = isCode 
                ? `「✿」*SOLICITUD DE CÓDIGO* ◢\n\n➩ El código llegará en segundos para: @${phone}`
                : `「✿」*SOLICITUD DE QR* ◢\n\n➩ Escanea el QR de abajo.`;

            await client.reply(m.chat, caption, m, { mentions: [sender, phone + '@s.whatsapp.net'] });
            
            await startSubBot(m, client, caption, isCode, phone, m.chat, global.subBotFlags, true);
            user.Subs = new Date() * 1;
            
        } catch (e) {
            console.error("ERROR SUBBOT:", e);
        }
    }
};
