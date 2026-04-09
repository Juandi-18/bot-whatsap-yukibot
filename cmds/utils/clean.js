const clean = {
    command: ['clean', 'borrar', 'del'],
    category: 'utils',
    isAdmin: true,
    botAdmin: true,
    run: async (client, m, args, usedPrefix, command, text) => {
        const count = parseInt(args[0]);
        if (isNaN(count) || count < 1) return client.reply(m.chat, `⚠️ ¿Cuántos mensajes quieres borrar?\nEjemplo: *${usedPrefix + command} 5*`, m);

        const maxBorrado = count > 20 ? 20 : count;

        try {
            let chatMem = client.messages ? client.messages[m.chat] : null;
            let messages = chatMem?.array || [];

            if (messages.length === 0) {
                return client.reply(m.chat, `❌ No hay mensajes recientes en mi memoria.`, m);
            }

            // Seleccionamos los mensajes SIN excluir nada (para que borre comandos y respuestas del bot)
            const toDelete = messages.slice(-maxBorrado).reverse();

            for (let msg of toDelete) {
                // Mantenemos el ritmo humano de 1.5 segundos
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                try {
                    await client.sendMessage(m.chat, { delete: msg.key });
                } catch (err) {
                    // Si un mensaje ya fue borrado o es muy viejo, ignoramos el error y seguimos
                    continue;
                }
            }

            // Mensaje final único
            return client.reply(m.chat, `✅ Limpieza terminada con éxito.`, m);

        } catch (e) {
            console.log("ERROR EN CLEAN:", e);
            return await client.sendMessage(m.chat, { delete: m.key });
        }
    }
};

export default clean;
