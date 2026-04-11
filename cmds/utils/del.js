const del = {
    command: ['del'],
    category: 'utils',
    isAdmin: true,
    botAdmin: true,
    run: async (client, m, args, usedPrefix, command, text) => {
        try {
            // 1. Borrado por RESPUESTA (Prioridad Máxima)
            // Si respondes a un mensaje (texto, gif, imagen) y pones solo !del
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
                return client.reply(m.chat, `⚠️ *Uso Correcto:*\n\n• *${usedPrefix + command} [número]* (Borrado masivo)\n• Responde a un mensaje con *${usedPrefix + command}* (Borra ese mensaje)`, m);
            }

            // Límite de seguridad para evitar spam/ban
            const maxBorrado = count > 50 ? 50 : count;

            // Cargamos mensajes directamente desde el chat (más efectivo para GIFs que el store)
            let messages = [];
            try {
                // Intentamos obtener el historial real del chat
                messages = await client.getMessages(m.chat, { limit: maxBorrado });
            } catch (e) {
                // Si falla, intentamos usar el store como respaldo
                if (client.store && client.store.messages[m.chat]) {
                    messages = client.store.messages[m.chat].array || [];
                }
            }

            if (!messages || messages.length === 0) {
                return client.reply(m.chat, `❌ No encontré mensajes recientes para eliminar.`, m);
            }

            // Invertimos la lista para borrar del más nuevo al más viejo
            const toDelete = [...messages].reverse().slice(0, maxBorrado);

            for (let msg of toDelete) {
                // Pausa anti-spam (800ms es seguro y fluido)
                await new Promise(resolve => setTimeout(resolve, 800));

                try {
                    // Re-construimos la key para asegurar que WhatsApp reconozca el mensaje
                    // Esto ayuda a que no ignore los multimedia/GIFs
                    const key = {
                        remoteJid: m.chat,
                        fromMe: msg.key.fromMe,
                        id: msg.key.id,
                        participant: msg.key.participant || msg.participant
                    };

                    await client.sendMessage(m.chat, { delete: key });
                } catch (err) {
                    // Si falla un borrado individual, intentamos el método simple antes de saltar
                    await client.sendMessage(m.chat, { delete: msg.key }).catch(() => {});
                }
            }

            // Mensaje de confirmación temporal
            let response = await client.reply(m.chat, `✅ Se eliminaron ${toDelete.length} mensajes (incluyendo multimedia).`, m);
            
            // El mensaje de confirmación se borra solo tras 4 segundos para dejar el chat limpio
            setTimeout(async () => {
                await client.sendMessage(m.chat, { delete: response.key }).catch(() => {});
            }, 4000);

        } catch (e) {
            console.log("ERROR EN COMMAND DEL:", e);
            // En caso de error total, borra al menos el comando del usuario
            return await client.sendMessage(m.chat, { delete: m.key });
        }
    }
};

export default del;
