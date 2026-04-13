// Función para crear pausas (ms = milisegundos)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export default {
    command: ['del', 'delete', 'clean'],
    category: 'utils',
    isAdmin: true, 
    botAdmin: true, 
    run: async (client, m, args) => {
        try {
            const chatId = m.chat;
            
            if (!client.messages || !client.messages[chatId] || client.messages[chatId].array.length === 0) {
                return m.reply("《✧》 No hay mensajes en mi memoria para limpiar. ♡");
            }

            let amount = parseInt(args[0]) || 10;
            if (amount > 50) amount = 50; // Bajamos el límite a 50 para mayor seguridad humana
            if (amount < 1) amount = 1;

            const messagesToPurge = client.messages[chatId].array.slice(-amount).reverse();

            // Mensaje de inicio
            const statusMsg = await client.reply(chatId, `「✿」 Iniciando limpieza de *${messagesToPurge.length}* mensajes... ꕤ\n> ○ Por seguridad, esto tomará unos segundos.`, m);

            for (let msg of messagesToPurge) {
                try {
                    await client.sendMessage(chatId, { delete: msg.key });
                    
                    // --- COMPORTAMIENTO HUMANO ---
                    // Espera entre 1.5 y 3 segundos de forma aleatoria entre cada mensaje
                    const waitTime = Math.floor(Math.random() * (3000 - 1500 + 1)) + 1500;
                    await delay(waitTime);
                    
                } catch (err) {
                    continue; // Si el mensaje es muy viejo o ya se borró, sigue
                }
            }

            // Limpiamos la memoria del bot
            client.messages[chatId].array = client.messages[chatId].array.filter(
                m => !messagesToPurge.includes(m)
            );

            // Borramos el mensaje de estado y confirmamos
            await client.sendMessage(chatId, { delete: statusMsg.key });
            const finalConfirm = await client.reply(chatId, `「✿」 Limpieza completada con éxito. ꕤ`, m);
            
            // Borramos la confirmación final después de 4 segundos
            await delay(4000);
            await client.sendMessage(chatId, { delete: finalConfirm.key });

        } catch (e) {
            console.error("ERROR EN DEL:", e);
            m.reply("《✧》 Ocurrió un error inesperado durante la limpieza. ♡");
        }
    },
};
