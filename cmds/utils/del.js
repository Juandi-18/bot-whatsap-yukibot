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
            if (isNaN(count) || count < 1) return; // Salir silenciosamente si no hay número

            const maxBorrado = count > 50 ? 50 : count;
            let messages = [];
            
            try {
                const fetch = await client.fetchMessagesFromServer(m.chat, maxBorrado);
                messages = fetch.map(v => v.message);
            } catch {
                if (client.store && client.store.messages[m.chat]) {
                    messages = client.store.messages[m.chat].array || [];
                }
            }

            if (!messages || messages.length === 0) return;

            const toDelete = [...messages].reverse().slice(0, maxBorrado);

            for (let msg of toDelete) {
                await new Promise(resolve => setTimeout(resolve, 800));
                try {
                    await client.sendMessage(m.chat, { delete: msg.key });
                } catch (err) {
                    continue;
                }
            }

            // --- MENSAJE DE CONFIRMACIÓN ELIMINADO ---
            // El bot ahora solo borrará y no dirá nada más.

        } catch (e) {
            // Solo loguear error en consola, no enviar mensaje al chat
            console.log("ERROR EN COMMAND DEL:", e);
        }
    }
};

export default del;
