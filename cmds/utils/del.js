const del = {
    command: ['del'],
    category: 'utils',
    isAdmin: true, 
    run: async (client, m, args, usedPrefix, command) => {
        try {
            // --- NUEVO: AVISO SI NO HAY ARGUMENTOS ---
            if (!m.quoted && (!args[0] || isNaN(parseInt(args[0])))) {
                return client.reply(m.chat, "《✧》 Elija la cantidad de mensajes a eliminar o responda a un mensaje para eliminarlo. ♡", m);
            }

            const botNumber = client.user.id.split(':')[0]; 

            // 1. Borrado por RESPUESTA (Respondiendo a un mensaje)
            if (m.quoted && !args[0]) {
                const keyToDelete = {
                    remoteJid: m.chat,
                    fromMe: m.quoted.fromMe,
                    id: m.quoted.id,
                    participant: m.quoted.sender
                };

                try {
                    return await client.sendMessage(m.chat, { delete: keyToDelete });
                } catch (err) {
                    return client.reply(m.chat, "《✧》 No pude borrar el mensaje. Asegúrate de que soy Administrador del grupo. ♡", m);
                }
                return;
            }

            // 2. Borrado por CANTIDAD (Ej: !del 5)
            const count = parseInt(args[0]);
            if (isNaN(count) || count < 1) return;

            const maxBorrado = count > 50 ? 50 : count;
            
            // Usamos la memoria temporal del bot
            let messages = client.messages?.[m.chat]?.array || [];

            if (!messages || messages.length === 0) {
                return client.reply(m.chat, "ꕤ No tengo mensajes recientes guardados en mi memoria temporal para borrar.", m);
            }

            const toDelete = [...messages]
                .filter(msg => msg.key.id !== m.key.id) 
                .reverse()
                .slice(0, maxBorrado);

            let falloPorPermisos = false;

            // Borrado progresivo
            for (let msg of toDelete) {
                await new Promise(resolve => setTimeout(resolve, 400)); 
                try {
                    return await client.sendMessage(m.chat, { delete: msg.key });
                } catch (err) {
                    falloPorPermisos = true;
                    break; 
                }
            }

            if (falloPorPermisos) {
                return client.reply(m.chat, "《✧》 Se detuvo el borrado. Necesito ser Administrador para borrar los mensajes de otros. ♡", m);
            }

        } catch (e) {
            console.log("ERROR EN COMMAND DEL:", e);
        }
    }
};

export default del;
