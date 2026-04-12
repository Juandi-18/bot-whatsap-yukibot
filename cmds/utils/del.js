const del = {
    command: ['del'],
    category: 'utils',
    isAdmin: true, // Tú sí necesitas ser admin para usarlo
    // botAdmin: true, <-- Lo quitamos para que el main.js no lo bloquee por error
    run: async (client, m, args, usedPrefix, command) => {
        try {
            // 1. Borrado por RESPUESTA (Respondiendo a un mensaje específico)
            if (m.quoted && !args[0]) {
                // Si el bot intenta borrar el mensaje de OTRA persona, verificamos si es admin en vivo
                if (!m.quoted.fromMe && m.isGroup) {
                    const groupMetadata = await client.groupMetadata(m.chat).catch(() => null);
                    const botId = client.user.id.split(':')[0] + '@s.whatsapp.net';
                    const isBotAdmin = groupMetadata?.participants.some(p => p.id === botId && (p.admin === 'admin' || p.admin === 'superadmin'));
                    
                    if (!isBotAdmin) {
                        return client.reply(m.chat, "《✧》 Necesito ser Administrador del grupo para borrar mensajes de otras personas. ♡", m);
                    }
                }

                // Construimos la llave exacta del mensaje para que Baileys no falle
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
            
            // Usamos la memoria súper ligera que creamos en el main.js
            if (client.messages && client.messages[m.chat] && client.messages[m.chat].array) {
                messages = client.messages[m.chat].array;
            }

            if (!messages || messages.length === 0) {
                return client.reply(m.chat, "ꕤ No tengo mensajes recientes guardados en mi memoria temporal para borrar.", m);
            }

            // Filtramos para no borrar el comando "!del 5" que acabas de enviar
            const toDelete = [...messages]
                .filter(msg => msg.key.id !== m.key.id) 
                .reverse()
                .slice(0, maxBorrado);

            if (toDelete.length > 0 && m.isGroup) {
                // Validamos en vivo antes de hacer un borrado masivo
                const groupMetadata = await client.groupMetadata(m.chat).catch(() => null);
                const botId = client.user.id.split(':')[0] + '@s.whatsapp.net';
                const isBotAdmin = groupMetadata?.participants.some(p => p.id === botId && (p.admin === 'admin' || p.admin === 'superadmin'));
                
                if (!isBotAdmin) {
                     return client.reply(m.chat, "《✧》 Necesito ser Administrador para hacer un borrado masivo en el grupo. ♡", m);
                }
            }

            // Borrado progresivo para que WhatsApp no bloquee al bot
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
