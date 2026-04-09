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
            // Accedemos a la memoria global que definimos en main.js
            let chatMem = client.messages ? client.messages[m.chat] : null;
            let messages = chatMem?.array || [];

            if (messages.length === 0) {
                return client.reply(m.chat, `❌ No tengo mensajes registrados en este chat.\n\n> *Tip:* Escribe un par de mensajes normales antes de usar el comando para que el bot los reconozca.`, m);
            }

            // Filtramos el historial para no borrar el comando mismo de forma abrupta
            const toDelete = messages.filter(v => v.key.id !== m.key.id).slice(-maxBorrado).reverse();

            client.reply(m.chat, `⏳ Borrando ${toDelete.length} mensajes (historial detectado)...`, m);

            for (let msg of toDelete) {
                // RITMO ANTI-SPAM: 1.5 segundos entre mensajes
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                try {
                    await client.sendMessage(m.chat, { delete: msg.key });
                } catch (err) {
                    console.log("No se pudo borrar un mensaje individual:", err.message);
                }
            }

            return client.reply(m.chat, `✅ Limpieza terminada con éxito.`, m);

        } catch (e) {
            console.log("DETALLE DEL ERROR FINAL:", e);
            return await client.sendMessage(m.chat, { delete: m.key });
        }
    }
};

export default clean;
