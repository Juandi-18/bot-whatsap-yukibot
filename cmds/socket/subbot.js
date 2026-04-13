import { startSubBot } from '../../core/subs.js';

export default {
    command: ['code', 'qr'],
    category: 'socket',
    run: async (client, m, { args, usedPrefix, command }) => {
        try {
            const sender = m.sender;
            const isCode = command.toLowerCase().includes('code');

            // 1. Limpiar número de teléfono
            let phone = sender.split('@')[0];
            if (args && args[0]) {
                phone = args[0].replace(/\D/g, '');
            }

            // 2. Notificación de inicio (Si esto sale, el comando SÍ detecta)
            await client.sendMessage(m.chat, { 
                text: `⏳ *YukiBot* está procesando tu solicitud de ${isCode ? 'Código' : 'QR'}...` 
            }, { quoted: m });

            // 3. Configurar bandera global
            if (!global.subBotFlags) global.subBotFlags = {};
            global.subBotFlags[sender] = {
                active: true,
                chatId: m.chat
            };

            // 4. Llamar a la función del núcleo
            // IMPORTANTE: Verifica que la ruta '../../core/subs.js' sea correcta según tu estructura
            await startSubBot(m, client, '', isCode, phone, m.chat, global.subBotFlags, true);

        } catch (e) {
            console.error("❌ ERROR EN COMANDO SUBBOT:", e);
            await m.reply("⚠️ Hubo un fallo interno al intentar generar el socket.");
        }
    }
};
