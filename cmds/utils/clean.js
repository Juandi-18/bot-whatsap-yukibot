const clean = {
    command: ['clean', 'borrar', 'del'],
    category: 'utils',
    isAdmin: true,
    botAdmin: true,
    run: async (client, m, args, usedPrefix, command, text) => {
        const count = parseInt(args[0]);
        if (isNaN(count) || count < 1) return client.reply(m.chat, `⚠️ ¿Cuántos mensajes quieres borrar?\nEjemplo: *${usedPrefix + command} 5*`, m);

        const maxBorrado = count > 50 ? 50 : count;

        try {
            // Buscamos en el 'store', que es donde Baileys guarda el historial real
            // Intentamos varias rutas comunes donde YukiBot guarda estos datos
            let list = [];
            if (client.store && client.store.messages[m.chat]) {
                list = client.store.messages[m.chat].array || [];
            } else if (client.messages && client.messages[m.chat]) {
                list = client.messages[m.chat].array || [];
            }

            if (list.length === 0) {
                return client.reply(m.chat, `❌ No encontré mensajes en mi historial para borrar.`, m);
            }

            // Invertimos la lista para borrar de lo más nuevo a lo más viejo
            // Incluimos el mensaje del comando y todo lo que esté antes
            const toDelete = [...list].reverse().slice(0, maxBorrado);

            for (let msg of toDelete) {
                // RITMO ANTI-SPAM (1.5 segundos)
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                try {
                    // Borramos usando la llave que está en el store
                    await client.sendMessage(m.chat, { delete: msg.key });
                } catch (err) {
                    // Si falla uno (por ser muy viejo o ya borrado), seguimos
                    continue;
                }
            }

            // Mensaje final silencioso
            return client.reply(m.chat, `✅ Limpieza terminada.`, m);

        } catch (e) {
            console.log("ERROR EN CLEAN:", e);
            // Si todo falla, al menos borra el comando que activó la función
            return await client.sendMessage(m.chat, { delete: m.key });
        }
    }
};

export default clean;
