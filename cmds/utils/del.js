const del = {
    command: ['del'],
    category: 'utils',
    isAdmin: true, // Requerido para que un usuario normal no borre el chat
    // botAdmin: true, <-- IMPORTANTE: Esto debe estar borrado/comentado
    run: async (client, m, args, usedPrefix, command) => {
        try {
            // Obtenemos el número puro del bot a prueba de errores
            const botNumber = client.user.id.split(':')[0];

            // 1. Borrado por RESPUESTA (Respondiendo a un mensaje)
            if (m.quoted && !args[0]) {
                if (!m.quoted.fromMe && m.isGroup) {
                    const groupMetadata = await client.groupMetadata(m.chat).catch(() => null);
                    // Validación a prueba de fallos con .includes()
                    const isBotAdmin = groupMetadata?.participants.some(p => p.id.includes(botNumber) && (p.admin === 'admin' || p.admin === 'superadmin'));
                    
                    if (!isBotAdmin) {
                        return client.reply(m.chat, "《✧》 Necesito ser Administrador del grupo para borrar mensajes de otras personas. ♡", m);
                    }
                }

                const keyToDelete = {
                    remoteJid: m.chat,
                    fromMe: m.quoted.fromMe,
                    id: m.quoted.id,
                    participant: m.quoted.sender
                };

                return await client.sendMessage(m.chat, { delete: keyToDelete });
            }

            // 2. Borrado por CANTIDAD (Ej: !del 5)
            const count = parseInt(args[0]);
            if (isNaN(count) || count < 1) return;

            const maxBorrado = count > 50 ? 50 : count;
            let messages = [];
            
            // Usamos la memoria RAM del bot
            if (client.messages && client.messages[m.chat] && client.messages[m.chat].array) {
                messages = client.messages[m.chat].array;
            }

            if (!messages || messages.length === 0) {
                return client.reply(m.chat, "ꕤ No tengo mensajes recientes guardados en mi memoria temporal para borrar.", m);
            }

            const toDelete = [...messages]
                .filter(msg => msg.key.id !== m.key.id) 
                .reverse()
                .slice(0, maxBorrado);

            if (toDelete.length > 0 && m.isGroup) {
                const groupMetadata = await client.groupMetadata(m.chat).catch(() => null);
                // Validación a prueba de fallos con .includes()
                const isBotAdmin = groupMetadata?.participants.some(p => p.id.includes(botNumber) && (p.admin === 'admin' || p.admin === 'superadmin'));
                
                if (!isBotAdmin) {
                     return client.reply(m.chat, "《✧》 Necesito ser Administrador para hacer un borrado masivo en el grupo. ♡", m);
                }
            }

            // Borrado progresivo (sin mensajes de confirmación molestos)
            for (let msg of toDelete) {
                await new Promise(resolve => setTimeout(resolve, 400)); 
                try {
                    await client.sendMessage(m.chat, { delete: msg.key });
                } catch (err) {
                    continue;
                }
            }

        } catch (e) {
            console.log("ERROR EN COMMAND DEL:", e);
        }
    }
};

export default del;
