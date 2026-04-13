const del = {
    command: ['del', 'delete', 'borrar'],
    category: 'utils',
    isAdmin: true, 
    run: async (client, m, args) => { // Recibe args directamente
        try {
            // 1. AVISO SI NO HAY ARGUMENTOS
            if (!m.quoted && (!args || !args[0] || isNaN(parseInt(args[0])))) {
                return client.reply(m.chat, "「✿」 *MODO DE USO* ◢\n\n➩ Responde a un mensaje para borrarlo.\n➩ Escribe *!del 5* para borrar los últimos 5 mensajes. ꕤ", m);
            }

            // 2. BORRADO POR RESPUESTA
            if (m.quoted && (!args || !args[0])) {
                const keyToDelete = {
                    remoteJid: m.chat,
                    fromMe: m.quoted.fromMe,
                    id: m.quoted.id,
                    participant: m.quoted.sender
                };
                return await client.sendMessage(m.chat, { delete: keyToDelete });
            }

            // 3. BORRADO POR CANTIDAD
            const count = parseInt(args[0]);
            if (isNaN(count) || count < 1) return;
            const maxBorrado = count > 50 ? 50 : count;
            
            let messages = await client.loadMessages(m.chat, maxBorrado + 1);
            if (!messages || messages.length === 0) return;

            const toDelete = messages.filter(msg => msg.key.id !== m.key.id);

            for (let msg of toDelete) {
                try {
                    await client.sendMessage(m.chat, { delete: msg.key });
                    await new Promise(resolve => setTimeout(resolve, 350)); 
                } catch (e) {}
            }
        } catch (e) {
            console.log("ERROR EN DEL:", e);
        }
    }
};
export default del;
