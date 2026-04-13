const del = {
    command: ['del', 'delete', 'borrar'],
    category: 'utils',
    isAdmin: true, 
    run: async (client, m, { args }) => {
        try {
            // 1. AVISO SI NO HAY ARGUMENTOS
            if (!m.quoted && (!args[0] || isNaN(parseInt(args[0])))) {
                return client.reply(m.chat, "「✿」 *¿Cómo usar?* ◢\n\n➩ Responde a un mensaje para borrarlo.\n➩ Escribe *!del 5* para borrar los últimos 5 mensajes. ꕤ", m);
            }

            // 2. BORRADO POR RESPUESTA
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
                    return client.reply(m.chat, "《✧》 No pude borrar el mensaje. Asegúrate de que soy Admin. ♡", m);
                }
            }

            // 3. BORRADO POR CANTIDAD (!del 5)
            const count = parseInt(args[0]);
            if (isNaN(count) || count < 1) return;

            const maxBorrado = count > 50 ? 50 : count;
            
            // Buscamos los mensajes en el historial cargado en el chat
            // Nota: Si el bot se acaba de encender, solo verá mensajes nuevos
            let messages = await client.loadMessages(m.chat, maxBorrado + 1);

            if (!messages || messages.length === 0) {
                return client.reply(m.chat, "ꕤ No encontré mensajes recientes para borrar.", m);
            }

            // Filtramos para no intentar borrar el comando que acabas de escribir
            const toDelete = messages.filter(msg => msg.key.id !== m.key.id);

            let borrados = 0;
            for (let msg of toDelete) {
                try {
                    // --- CORRECCIÓN CLAVE: Quitamos el 'return' ---
                    await client.sendMessage(m.chat, { delete: msg.key });
                    borrados++;
                    // Pequeña pausa para no saturar WhatsApp
                    await new Promise(resolve => setTimeout(resolve, 350)); 
                } catch (err) {
                    console.log("No se pudo borrar un mensaje:", err);
                }
            }

            // Opcional: El bot te avisa cuántos borró
            console.log(`[ ✿ ] Se borraron ${borrados} mensajes en ${m.chat}`);

        } catch (e) {
            console.log("ERROR EN COMMAND DEL:", e);
        }
    }
};

export default del;
