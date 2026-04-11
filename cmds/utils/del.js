const del = {
    command: ['del'],
    category: 'utils',
    isAdmin: true,
    botAdmin: true,
    run: async (client, m, args, usedPrefix, command, text) => {
        try {
            // 1. Borrado por RESPUESTA
            if (m.quoted && !args[0]) {
                return await client.sendMessage(m.chat, { 
                    delete: {
                        remoteJid: m.chat,
                        fromMe: m.quoted.fromMe,
                        id: m.quoted.id,
                        participant: m.quoted.sender
                    }
                });
            }

            // 2. Borrado por CANTIDAD
            const count = parseInt(args[0]);
            if (isNaN(count) || count < 1) {
                return client.reply(m.chat, `⚠️ Uso: *${usedPrefix + command} [número]*`, m);
            }

            const maxBorrado = count > 50 ? 50 : count;

            // MÉTODO CRÍTICO: Intentamos obtener mensajes de 3 formas distintas
            let messages = [];
            
            // Intento A: Cargar directamente del chat (Método más agresivo)
            try {
                const fetch = await client.fetchMessagesFromServer(m.chat, maxBorrado);
                messages = fetch.map(v => v.message);
            } catch {
                // Intento B: Usar el historial local si el servidor falla
                try {
                    messages = await client.getMessages(m.chat, { limit: maxBorrado });
                } catch {
                    // Intento C: Usar el store global
                    if (client.store && client.store.messages[m.chat]) {
                        messages = client.store.messages[m.chat].array || [];
                    }
                }
            }

            if (!messages || messages.length === 0) {
                // Si llegamos aquí, el comando !del mismo es el único mensaje detectable
                // Intentaremos borrar al menos el comando para que no se quede el error
                await client.sendMessage(m.chat, { delete: m.key });
                return client.reply(m.chat, `❌ El historial está vacío o no es accesible todavía.`, m);
            }

            // Invertimos y cortamos según la cantidad pedida
            const toDelete = [...messages].reverse().slice(0, maxBorrado);

            for (let msg of toDelete) {
                await new Promise(resolve => setTimeout(resolve, 800));
                try {
                    // Usamos la key original del mensaje encontrado
                    await client.sendMessage(m.chat, { delete: msg.key });
                } catch (err) {
                    continue;
                }
            }

            let response = await client.reply(m.chat, `✅ Limpieza de ${toDelete.length} mensajes terminada.`, m);
            
            setTimeout(async () => {
                await client.sendMessage(m.chat, { delete: response.key }).catch(() => {});
            }, 3000);

        } catch (e) {
            console.log("ERROR EN COMMAND DEL:", e);
            return await client.sendMessage(m.chat, { delete: m.key });
        }
    }
};

export default del;
