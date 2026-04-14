const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export default {
    command: ['del', 'delete', 'clean'],
    category: 'utils',
    isAdmin: true, 
    botAdmin: true, 
    run: async (client, m, { args, usedPrefix, command }) => {
        try {
            const chatId = m.chat;

            // --- FUNCIÓN 1: BORRADO POR RESPUESTA (Para videos de TikTok, etc.) ---
            if (m.quoted) {
                await client.sendMessage(chatId, { delete: m.quoted.fakeObj.key })
                return await m.react('🗑️');
            }

            // --- FUNCIÓN 2: LIMPIEZA MASIVA (Tu código original optimizado) ---
            if (!client.messages || !client.messages[chatId] || client.messages[chatId].array.length === 0) {
                return m.reply("《✧》 No hay mensajes en mi memoria para limpiar. ♡");
            }

            let amount = parseInt(args[0]) || 10;
            if (amount > 50) amount = 50; 
            if (amount < 1) amount = 1;

            const messagesToPurge = client.messages[chatId].array.slice(-amount).reverse();
            const statusMsg = await client.reply(chatId, `「✿」 Iniciando limpieza de *${messagesToPurge.length}* mensajes... ꕤ`, m);

            for (let msg of messagesToPurge) {
                try {
                    // Verificamos que el mensaje no sea el de estado para no borrarlo antes de tiempo
                    if (msg.key.id === statusMsg.key.id) continue;
                    
                    await client.sendMessage(chatId, { delete: msg.key });
                    const waitTime = Math.floor(Math.random() * (1000 - 500 + 1)) + 500; // Un poco más rápido
                    await delay(waitTime);
                } catch {
                    continue;
                }
            }

            // Limpieza de memoria local
            client.messages[chatId].array = client.messages[chatId].array.filter(
                msg => !messagesToPurge.includes(msg)
            );

            await client.sendMessage(chatId, { delete: statusMsg.key });
            const finalConfirm = await client.reply(chatId, `「✿」 Limpieza completada con éxito. ꕤ`, m);
            
            await delay(3000);
            await client.sendMessage(chatId, { delete: finalConfirm.key });

        } catch (e) {
            console.error("ERROR EN DEL:", e);
            m.reply("《✧》 Ocurrió un error inesperado durante la limpieza. ♡");
        }
    },
};
