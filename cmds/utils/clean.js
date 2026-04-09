const clean = {
    command: ['clean', 'borrar', 'del'],
    category: 'utils',
    isAdmin: true,
    botAdmin: true,
    run: async (client, m, args, usedPrefix, command, text) => {
        const count = parseInt(args[0]);
        if (isNaN(count) || count < 1) return client.reply(m.chat, `⚠️ ¿Cuántos mensajes quieres borrar?\nEjemplo: *${usedPrefix + command} 10*`, m);

        // Limitamos a un máximo por seguridad de ejecución
        const maxBorrado = count > 100 ? 100 : count;

        try {
            // Obtenemos los mensajes
            const messagesFetch = await client.fetchMessagesFromWA(m.chat, { count: maxBorrado + 1 });
            const toDelete = messagesFetch.reverse();

            client.reply(m.chat, `⏳ Iniciando limpieza segura de ${maxBorrado} mensajes...`, m);

            for (let i = 0; i < toDelete.length; i++) {
                // --- RITMO DE SEGURIDAD ---
                // Espera 1.5 segundos entre cada borrado para que parezca humano
                await new Promise(resolve => setTimeout(resolve, 1500)); 
                
                await client.sendMessage(m.chat, { delete: toDelete[i].key });
            }

            return client.reply(m.chat, `✅ Limpieza completada con éxito.`, m);

        } catch (e) {
            console.log("DETALLE DEL ERROR:", e);
            return client.reply(m.chat, `❌ Error en el proceso: ${e.message}`, m);
        }
    }
};

export default clean;
