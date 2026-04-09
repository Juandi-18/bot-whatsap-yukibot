const clean = {
    command: ['clean', 'borrar', 'del'],
    category: 'utils',
    isAdmin: true,
    botAdmin: true,
    run: async (client, m, args, usedPrefix, command, text) => {
        const count = parseInt(args[0]);
        if (isNaN(count) || count < 1) return client.reply(m.chat, `⚠️ ¿Cuántos mensajes quieres borrar?\nEjemplo: *${usedPrefix + command} 10*`, m);

        const maxBorrado = count > 50 ? 50 : count;

        try {
            // MÉTODO DE RASTREO DIRECTO: Pedimos a WhatsApp los mensajes reales del chat
            // Esto incluirá el menú de !help aunque el bot no lo haya guardado en RAM
            const storeMessages = await client.fetchMessagesFromWA(m.chat, { count: maxBorrado + 2 });
            
            // Si el método de arriba falla en tu versión, usamos el historial del store
            let list = storeMessages || (client.store?.messages[m.chat]?.array) || [];
            
            if (list.length === 0) {
                return client.reply(m.chat, `❌ No pude encontrar mensajes en el historial del chat.`, m);
            }

            // Invertimos para empezar por lo más nuevo
            const toDelete = list.reverse().slice(0, maxBorrado);

            for (let msg of toDelete) {
                // RITMO ANTI-SPAM: 1.5 segundos
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                try {
                    // Borramos usando la llave exacta que WhatsApp nos devolvió
                    await client.sendMessage(m.chat, { delete: msg.key });
                } catch (err) {
                    continue; 
                }
            }

            // Mensaje final
            return client.reply(m.chat, `✅ Limpieza completada.`, m);

        } catch (e) {
            console.log("ERROR EN CLEAN:", e);
            // Si el rastreo falla, intentamos borrar solo el comando para no dejar rastro
            return await client.sendMessage(m.chat, { delete: m.key });
        }
    }
};

export default clean;
