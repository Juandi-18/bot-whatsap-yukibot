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
            
            // 1. VERIFICAR MEMORIA
            if (!client.messages || !client.messages[chatId] || client.messages[chatId].array.length === 0) {
                return m.reply("《✧》 No hay mensajes en mi memoria para limpiar. ♡");
            }

            // 2. DETERMINAR CANTIDAD (Máximo 50 por seguridad)
            let amount = parseInt(args[0]) || 10;
            if (amount > 50) amount = 50; 
            if (amount < 1) amount = 1;

            // Obtenemos los mensajes de la memoria (del más nuevo al más viejo)
            const messagesToPurge = client.messages[chatId].array.slice(-amount).reverse();

            // Mensaje de inicio
            const statusMsg = await client.reply(chatId, `「✿」 Iniciando limpieza rápida de *${messagesToPurge.length}* mensajes... ꕤ`, m);

            // 3. CICLO DE BORRADO HUMANO RÁPIDO
            for (let msg of messagesToPurge) {
                try {
                    await client.sendMessage(chatId, { delete: msg.key });
                    
                    // --- TIEMPO OPTIMIZADO ---
                    // Espera entre 0.75 y 1.5 segundos por mensaje
                    const waitTime = Math.floor(Math.random() * (1500 - 750 + 1)) + 750;
                    await delay(waitTime);
                    
                } catch (err) {
                    continue; // Si el mensaje ya no existe, saltar al siguiente
                }
            }

            // 4. LIMPIEZA DE MEMORIA POST-BORRADO
            client.messages[chatId].array = client.messages[chatId].array.filter(
                msg => !messagesToPurge.includes(msg)
            );

            // 5. CONFIRMACIÓN FINAL
            await client.sendMessage(chatId, { delete: statusMsg.key });
            const finalConfirm = await client.reply(chatId, `「✿」 Limpieza completada con éxito. ꕤ`, m);
            
            // Borramos la confirmación después de 3 segundos para dejar el chat limpio
            await delay(3000);
            await client.sendMessage(chatId, { delete: finalConfirm.key });

        } catch (e) {
            console.error("ERROR EN DEL:", e);
            m.reply("《✧》 Ocurrió un error inesperado durante la limpieza. ♡");
        }
    },
};
