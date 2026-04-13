export default {
    command: ['del', 'delete', 'clean'],
    category: 'utils',
    isAdmin: true, // Solo admins pueden limpiar el chat
    botAdmin: true, // El bot necesita ser admin para borrar mensajes de otros
    run: async (client, m, args) => {
        try {
            const chatId = m.chat;
            
            // 1. VERIFICAR SI HAY MENSAJES EN MEMORIA
            if (!client.messages || !client.messages[chatId] || client.messages[chatId].array.length === 0) {
                return m.reply("《✧》 No hay mensajes registrados en mi memoria para borrar. ♡");
            }

            // 2. DETERMINAR CANTIDAD A BORRAR
            let amount = parseInt(args[0]) || 10; // Por defecto borra 10 si no pones número
            if (amount > 100) amount = 100; // Límite de seguridad
            if (amount < 1) amount = 1;

            // 3. OBTENER LOS ÚLTIMOS MENSAJES
            const messagesToPurge = client.messages[chatId].array.slice(-amount);

            // 4. EJECUTAR EL BORRADO
            for (let msg of messagesToPurge) {
                try {
                    // Usamos sendMessage con delete para cada mensaje
                    await client.sendMessage(chatId, { delete: msg.key });
                } catch (err) {
                    // Si falla un mensaje (ej: es muy antiguo), seguimos con el siguiente
                    continue;
                }
            }

            // Limpiamos la memoria del bot después de borrar
            client.messages[chatId].array = client.messages[chatId].array.filter(
                m => !messagesToPurge.includes(m)
            );

            // Mensaje temporal de confirmación (se puede borrar solo si quieres)
            const confirm = await client.reply(chatId, `「✿」 Se han eliminado *${messagesToPurge.length}* mensajes correctamente. ꕤ`, m);
            setTimeout(() => client.sendMessage(chatId, { delete: confirm.key }), 3000);

        } catch (e) {
            console.error("ERROR EN DEL:", e);
            m.reply("《✧》 Ocurrió un error al intentar borrar los mensajes. ♡");
        }
    },
};
