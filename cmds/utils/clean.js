const clean = {
    command: ['clean', 'borrar', 'del'],
    category: 'utils',
    isAdmin: true,
    botAdmin: true,
    run: async (client, m, args, usedPrefix, command, text) => {
        const count = parseInt(args[0]);
        if (isNaN(count) || count < 1) return client.reply(m.chat, `⚠️ ¿Cuántos mensajes quieres borrar?\nEjemplo: *${usedPrefix + command} 5*`, m);

        const maxBorrado = count > 20 ? 20 : count; // Límite bajo para probar estabilidad

        try {
            // MÉTODO COMPATIBLE: Buscamos en el historial que el bot ya tiene cargado
            let messages = client.messages[m.chat]?.array || [];
            if (messages.length === 0 && client.store) {
                messages = client.store.messages[m.chat]?.array || [];
            }

            if (messages.length === 0) {
                return client.reply(m.chat, `❌ No encontré mensajes recientes para borrar en mi memoria.`, m);
            }

            // Tomamos los últimos mensajes y los invertimos
            const toDelete = messages.slice(-maxBorrado).reverse();

            client.reply(m.chat, `⏳ Borrando ${toDelete.length} mensajes con ritmo de seguridad...`, m);

            for (let msg of toDelete) {
                // RITMO ANTI-SPAM: 2 segundos por mensaje
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Intentamos borrar usando la llave del mensaje
                await client.sendMessage(m.chat, { delete: msg.key });
            }

            return client.reply(m.chat, `✅ Limpieza terminada.`, m);

        } catch (e) {
            console.log("DETALLE DEL ERROR FINAL:", e);
            // Fallback: si todo falla, borra al menos el comando que escribiste
            return await client.sendMessage(m.chat, { delete: m.key });
        }
    }
};

export default clean;
