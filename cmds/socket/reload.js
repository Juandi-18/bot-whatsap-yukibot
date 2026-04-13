import { startSubBot } from '../../core/subs.js';
import fs from 'fs';
import path from 'path';
import { jidDecode } from '@whiskeysockets/baileys';

export default {
    command: ['reload'],
    category: 'socket',
    run: async (client, m, args) => {
        try {
            const botJid = client.user.id.split(':')[0] + '@s.whatsapp.net';
            const sender = m.sender;

            // 1. OBTENER IDS PARA COMPARAR
            const officialBotId = global.client?.user?.id?.split(':')[0] + '@s.whatsapp.net';
            const isOficialBot = client.decodeJid(botJid) === client.decodeJid(officialBotId);

            // --- FILTRO CRÍTICO: El Bot Principal debe ignorar este comando ---
            if (isOficialBot) {
                return; // Se sale sin decir nada para no estorbar
            }

            // 2. VALIDACIÓN DE SEGURIDAD (Solo Dueño o el propio Bot)
            const settings = global.db.data.settings[botJid] || {};
            const isOwners = [
                officialBotId, 
                ...(settings.owner ? [settings.owner] : []), 
                ...global.owner.map(num => num + '@s.whatsapp.net')
            ].map(v => client.decodeJid(v)).includes(client.decodeJid(sender));

            const isBot = m.key.fromMe;

            if (!isOwners && !isBot) {
                return client.reply(m.chat, `《✧》 *Acceso Denegado*\nSolo mi creador puede reiniciar mi instancia. ♡`, m);
            }

            // 3. LÓGICA DE REINICIO DE SUB-BOT
            const rawId = client.user?.id || '';
            const decoded = jidDecode(rawId);
            const cleanId = decoded?.user || rawId.split('@')[0];
            
            const sessionPath = path.join('Sessions', 'Subs', cleanId);

            if (!fs.existsSync(sessionPath)) {
                return client.reply(m.chat, '《✧》 No encontré tu carpeta de sesión. No puedo reiniciar. ♡', m);
            }

            const caption = `「✿」*Instancia Reiniciada* ◢\n\n➩ La sesión del Sub-Bot se ha refrescado correctamente. ꕤ`;
            const phone = args && args[0] ? args[0].replace(/\D/g, '') : sender.split('@')[0];
            const chatId = m.chat;

            // Ejecutamos el reinicio desde core/subs.js
            await startSubBot(m, client, caption, false, phone, chatId, {}, true);

            return await client.reply(m.chat, caption, m);

        } catch (e) {
            console.error("ERROR EN RELOAD:", e);
        }
    },
};
