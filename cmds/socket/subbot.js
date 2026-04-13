import { startSubBot } from '../../core/subs.js';

if (!global.subBotFlags) global.subBotFlags = {}

export default {
    command: ['code', 'qr'],
    category: 'socket',
    run: async (client, m, args, usedPrefix, command) => {
        try {
            const sender = m.sender;
            const isCode = command.toLowerCase().includes('code');

            // Cooldown de 1 minuto
            if (!global.db.data.users[sender]) global.db.data.users[sender] = {}
            let user = global.db.data.users[sender];
            if (new Date() - (user.Subs || 0) < 60000) {
                return client.reply(m.chat, `《✧》 Espera un minuto antes de pedir otro código. ♡`, m);
            }

            let phone = sender.split('@')[0];
            if (args && args[0]) {
                phone = args[0].replace(/\D/g, '');
            }

            global.subBotFlags[sender] = {
                active: true,
                chatId: m.chat
            };

            // Mensaje de espera mínimo
            await client.reply(m.chat, `⏳ Generando ${isCode ? 'código' : 'QR'} para @${phone}...`, m, { mentions: [phone + '@s.whatsapp.net'] });
            
            // Ejecución
            await startSubBot(m, client, '', isCode, phone, m.chat, global.subBotFlags, true);
            
            user.Subs = new Date() * 1;
            
        } catch (e) {
            console.error("ERROR EN SUBBOT CMD:", e);
        }
    }
};
