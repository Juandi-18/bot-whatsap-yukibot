import { startSubBot } from '../../core/subs.js';
import fs from 'fs';
import path from 'path';

// Flag global para que varios usuarios puedan pedir código al mismo tiempo
if (!global.subBotFlags) global.subBotFlags = {}

export default {
    command: ['code', 'qr'],
    category: 'socket',
    run: async (client, m, args, usedPrefix, command) => {
        try {
            const sender = m.sender;
            // Usamos 'command' que viene directo de tu main.js
            const isCode = command.toLowerCase().includes('code');

            // 1. REGISTRO Y COOLDOWN
            if (!global.db.data.users[sender]) global.db.data.users[sender] = {}
            let user = global.db.data.users[sender];
            
            let time = (user.Subs || 0) + 120000 
            if (new Date() - (user.Subs || 0) < 120000) {
                return client.reply(m.chat, `《✧》 Por favor, espera un momento para volver a solicitar una vinculación. ♡`, m);
            }

            // 2. EXTRACCIÓN SEGURA DEL NÚMERO
            let phone = sender.split('@')[0];
            if (args && args.length > 0 && args[0]) {
                phone = args[0].replace(/\D/g, '');
            }

            // 3. ACTIVAR BANDERA INDIVIDUAL
            global.subBotFlags[sender] = {
                active: true,
                chatId: m.chat
            };

            const rtxCode = `「✿」*SOLICITUD DE CÓDIGO* ◢\n\n➩ El código de 8 dígitos llegará en unos segundos para el número: @${phone}\n\n> ꕤ Si el número es incorrecto, usa: *${usedPrefix + command} número*`;
            const rtxQr = `「✿」*SOLICITUD DE QR* ◢\n\n➩ Escanea el código QR que aparecerá a continuación para activar tu Sub-Bot. ꕤ`;

            const caption = isCode ? rtxCode : rtxQr;

            // Enviamos mensaje de instrucciones con mención
            await client.reply(m.chat, caption, m, { mentions: [sender, phone + '@s.whatsapp.net'] });
            
            // 4. INICIAR PROCESO EN EL CORE
            // Pasamos los argumentos en el orden exacto que espera el core
            await startSubBot(m, client, caption, isCode, phone, m.chat, global.subBotFlags, true);
            
            user.Subs = new Date() * 1;
            
        } catch (e) {
            console.error("ERROR EN COMANDO SUBBOT:", e);
        }
    }
};
