const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export default {
    command: ['del', 'delete', 'clean'],
    category: 'utils',
    isAdmin: true, 
    botAdmin: true, 
    run: async (client, m, args) => { // Simplificamos la entrada para evitar errores de undefined
        try {
            const chatId = m.chat;

            // --- FUNCIÓN 1: BORRADO POR RESPUESTA ---
            if (m.quoted) {
                // Usamos una forma más segura de obtener la llave del mensaje citado
                const key = {
                    remoteJid: m.chat,
                    fromMe: m.quoted.fromMe,
                    id: m.quoted.id,
                    participant: m.quoted.sender
                };
                await client.sendMessage(chatId, { delete: key });
                return await m.react('🗑️');
            }

            // --- FUNCIÓN 2: LIMPIEZA MASIVA ---
            // Verificamos existencia de la memoria con seguridad
            if (!client.messages || !client.messages[chatId] || !client.messages[chatId].array || client.messages[chatId].array.length === 0) {
                return m.reply("《✧》 No hay mensajes en mi memoria para limpiar. ♡");
            }

            // Convertimos el argumento a número de forma segura
            let amount = parseInt(args && args[0] ? args[0] : 10);
            if (isNaN(amount) || amount < 1) amount = 10;
            if (amount > 50) amount = 50; 

            const messagesToPurge = client.messages[chatId].array.slice(-amount).reverse();
            
            // Usamos m.reply directamente para el estado
            const statusMsg = await m.reply(`「✿」 Iniciando limpieza de *${messagesToPurge.length}* mensajes... ꕤ`);

            for (let msg of messagesToPurge) {
                try {
                    // Evitamos borrar el mensaje de estado o mensajes inexistentes
                    if (!msg || !msg.key || msg.key.id === statusMsg.key.id) continue;
                    
                    await client.sendMessage(chatId, { delete: msg.key });
                    await delay(500); // Velocidad constante para evitar ban/bloqueo
                } catch {
                    continue;
                }
            }

            // Limpieza de memoria local filtrando IDs existentes
            client.messages[chatId].array = client.messages[chatId].array.filter(
                msg => !messagesToPurge.some(p => p.key.id === msg.key.id)
            );

            // Borramos mensaje de estado y enviamos confirmación final
            try { await client.sendMessage(chatId, { delete: statusMsg.key }); } catch {}
            
            const finalConfirm = await m.reply(`「✿」 Limpieza completada con éxito. ꕤ`);
            
            await delay(3000);
            try { await client.sendMessage(chatId, { delete: finalConfirm.key }); } catch {}

        } catch (e) {
            console.error("ERROR EN DEL:", e);
            // No dejamos que el bot se quede callado si falla
            return m.reply(`《✧》 Error: ${e.message} ♡`);
        }
    },
};
