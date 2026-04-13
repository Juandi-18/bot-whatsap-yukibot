import { startSubBot } from '../../core/subs.js';
import fs from 'fs';
import path from 'path';

if (!global.subBotFlags) global.subBotFlags = {}

export default {
    command: ['code', 'qr'],
    category: 'socket',
    run: async (client, m, args, usedPrefix, command) => {
        try {
            const sender = m.sender;
            const isCode = command.toLowerCase().includes('code');

            // 1. REGISTRO Y COOLDOWN (2 Minutos)
            if (!global.db.data.users[sender]) global.db.data.users[sender] = {}
            let user = global.db.data.users[sender];
            
            let time = (user.Subs || 0) + 120000 
            if (new Date() - (user.Subs || 0) < 120000) {
                return client.reply(m.chat, `《✧》 Por favor, espera un momento para volver a solicitar. ♡`, m);
            }

            // 2. EXTRACCIÓN DEL NÚMERO
            let phone = sender.split('@')[0];
            if (args && args[0]) {
                phone = args[0].replace(/\D/g, '');
            }

            // 3. CONFIGURAR BANDERA DE SESIÓN
            global.subBotFlags[sender] = {
                active: true,
                chatId: m.chat
            };

            const rtxCode = `「✿」*SOLICITUD DE CÓDIGO* ◢\n\n➩ El código de 8 dígitos llegará en segundos para: @${phone}\n\n> ꕤ Si no recibes nada en 15 segundos, reintenta. ♡`;
            const rtxQr = `「✿」*SOLICITUD DE QR* ◢\n\n➩ El código QR aparecerá a continuación. ꕤ`;

            const caption = isCode ? rtxCode : rtxQr;

            await client.reply(m.chat, caption, m, { mentions: [sender, phone + '@s.whatsapp.net'] });
            
            // 4. EJECUCIÓN (Orden de variables CRÍTICO)
            await startSubBot(m, client, caption, isCode, phone, m.chat, global.subBotFlags, true);
            
            user.Subs = new Date() * 1;
            
        } catch (e) {
            console.error("ERROR EN SUBBOT CMD:", e);
        }
    }
};
