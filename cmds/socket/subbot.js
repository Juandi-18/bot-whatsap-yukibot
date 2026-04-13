import { startSubBot } from '../../core/subs.js';

export default {
    command: ['code', 'qr'],
    category: 'socket',
    run: async (client, m, args, usedPrefix, command) => { // <--- CAMBIO AQUÍ (Sin llaves)
        try {
            const sender = m.sender;
            // Ahora 'command' no será undefined y el toLowerCase funcionará
            const isCode = command.toLowerCase().includes('code');

            // 1. Limpiar número de teléfono
            let phone = sender.split('@')[0];
            if (args && args[0]) {
                phone = args[0].replace(/\D/g, '');
            }

            // 2. Notificación de inicio
            await client.sendMessage(m.chat, { 
                text: `⏳ *YukiBot* está procesando tu solicitud de ${isCode ? 'Código' : 'QR'} para @${phone}...`,
                mentions: [phone + '@s.whatsapp.net']
            }, { quoted: m });

            // 3. Configurar bandera global
            if (!global.subBotFlags) global.subBotFlags = {};
            global.subBotFlags[sender] = {
                active: true,
                chatId: m.chat
            };

            // 4. Llamar a la función del núcleo
            await startSubBot(m, client, '', isCode, phone, m.chat, global.subBotFlags, true);

        } catch (e) {
            console.error("❌ ERROR EN COMANDO SUBBOT:", e);
            await m.reply("⚠️ Hubo un fallo interno al intentar generar el socket.");
        }
    }
};
