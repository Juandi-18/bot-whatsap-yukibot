const del = {
    command: ['del'],
    category: 'utils',
    isAdmin: true,
    botAdmin: true,
    run: async (client, m, args, usedPrefix, command, text) => {
        try {
            // 1. Borrar mensaje específico al que se responde
            if (m.quoted && !args[0]) {
                return await client.sendMessage(m.chat, { delete: m.quoted.fakeObj.key });
            }

            // 2. Validación para borrado masivo
            const count = parseInt(args[0]);
            if (isNaN(count) || count < 1) {
                return client.reply(m.chat, `⚠️ Uso: *${usedPrefix + command} [cantidad]* o responde a un mensaje con *${usedPrefix + command}*`, m);
            }

            const maxBorrado = count > 50 ? 50 : count;

            let list = [];
            if (client.store && client.store.messages[m.chat]) {
                list = client.store.messages[m.chat].array || [];
            } else if (client.messages && client.messages[m.chat]) {
                list = client.messages[m.chat].array || [];
            }

            if (list.length === 0) {
                return client.reply(m.chat, `❌ No hay mensajes recientes en el historial.`, m);
            }

            const toDelete = [...list].reverse().slice(0, maxBorrado);

            for (let msg of toDelete) {
                await new Promise(resolve => setTimeout(resolve, 800)); 
                
                try {
                    // Al usar msg.key directamente, forzamos el borrado de cualquier tipo (Texto, GIF, Imagen, etc.)
                    await client.sendMessage(m.chat, { delete: msg.key });
                } catch (err) {
                    continue;
                }
            }

            return client.reply(m.chat, `✅ Se eliminaron ${toDelete.length} mensajes.`, m);

        } catch (e) {
            console.log("ERROR EN DEL:", e);
            return await client.sendMessage(m.chat, { delete: m.key });
        }
    }
};

export default del;
