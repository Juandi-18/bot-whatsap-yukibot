const del = {
    command: ['del'],
    category: 'utils',
    isAdmin: true,
    botAdmin: true,
    run: async (client, m, args, usedPrefix, command, text) => {
        try {
            // 1. Borrado por respuesta (prioridad máxima)
            if (m.quoted) {
                return await client.sendMessage(m.chat, { delete: m.quoted.fakeObj.key });
            }

            // 2. Borrado masivo
            const count = parseInt(args[0]);
            if (isNaN(count) || count < 1) {
                return client.reply(m.chat, `⚠️ Uso: *${usedPrefix + command} [cantidad]*`, m);
            }

            // Limitamos a 50 para evitar baneo
            const maxBorrado = count > 50 ? 50 : count;

            // Cargamos los mensajes directamente del chat actual
            // Esto es más efectivo que el store para encontrar GIFs
            const messages = await client.getMessages(m.chat, { limit: maxBorrado });

            if (!messages || messages.length === 0) {
                return client.reply(m.chat, `❌ No encontré mensajes para borrar.`, m);
            }

            // Invertimos para borrar desde el último (el comando) hacia atrás
            const toDelete = messages.reverse();

            for (let msg of toDelete) {
                // Espera de seguridad
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                try {
                    // Borramos usando la key completa. 
                    // Al extraerla de getMessages, incluimos multimedia obligatoriamente.
                    await client.sendMessage(m.chat, { delete: msg.key });
                } catch (err) {
                    continue;
                }
            }

            // Mensaje de confirmación que se auto-borra a los 3 segundos
            let v = await client.reply(m.chat, `✅ Limpieza de ${toDelete.length} elementos completada.`, m);
            setTimeout(async () => {
                await client.sendMessage(m.chat, { delete: v.key });
            }, 3000);

        } catch (e) {
            console.log("ERROR CRÍTICO EN DEL:", e);
            // Si falla, borra al menos el comando
            return await client.sendMessage(m.chat, { delete: m.key });
        }
    }
};

export default del;
