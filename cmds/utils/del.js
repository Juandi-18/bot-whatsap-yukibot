const del = {
    command: ['del', 'delete', 'borrar'],
    category: 'utils',
    isAdmin: true, 
    run: async (client, m, g) => { // Cambiamos la forma de recibir datos a 'g' para mayor compatibilidad
        try {
            // Extraemos args de forma segura
            const args = g.args || [];
            
            // 1. AVISO SI NO HAY ARGUMENTOS Y NO SE ESTÁ RESPONDIENDO A UN MENSAJE
            if (!m.quoted && (!args[0] || isNaN(parseInt(args[0])))) {
                return client.reply(m.chat, "「✿」 *MODO DE USO* ◢\n\n➩ Responde a un mensaje para borrarlo.\n➩ Escribe *!del 5* para borrar los últimos 5 mensajes. ꕤ", m);
            }

            // 2. BORRADO POR RESPUESTA (Respondiendo a alguien)
            if (m.quoted && (!args[0] || isNaN(parseInt(args[0])))) {
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
            
            // Cargamos los mensajes del historial (esto es más seguro que usar la RAM)
            let messages = await client.loadMessages(m.chat, maxBorrado + 1);

            if (!messages || messages.length === 0) {
                return client.reply(m.chat, "ꕤ No encontré mensajes recientes para borrar.", m);
            }

            // Filtramos para no borrar el comando que acabas de enviar tú
            const toDelete = messages.filter(msg => msg.key.id !== m.key.id);

            // Bucle de borrado sin 'return' para que no se detenga en el primero
            for (let msg of toDelete) {
                try {
                    await client.sendMessage(m.chat, { delete: msg.key });
                    // Pausa de seguridad para evitar spam
                    await new Promise(resolve => setTimeout(resolve, 400)); 
                } catch (err) {
                    console.log("Error al borrar mensaje individual:", err);
                }
            }

        } catch (e) {
            console.log("ERROR EN COMMAND DEL:", e);
        }
    }
};

export default del;
