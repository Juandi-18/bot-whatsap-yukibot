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
            // Buscamos en todas las memorias posibles del bot
            let messages = [];
            
            // 1. Memoria que creamos en main.js
            if (client.messages && client.messages[m.chat]) {
                messages = [...client.messages[m.chat].array];
            }
            
            // 2. Si la memoria de main.js falló, intentamos con la del store (Baileys)
            if (messages.length < 2 && client.store && client.store.messages[m.chat]) {
                messages = client.store.messages[m.chat].array || [];
            }

            if (messages.length === 0) {
                return client.reply(m.chat, `❌ No hay mensajes grabados. Intenta escribir algo antes.`, m);
            }

            // Invertimos para borrar los más recientes primero
            const toDelete = messages.slice(-maxBorrado).reverse();

            for (let msg of toDelete) {
                // Pausa de seguridad para evitar baneo
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                try {
                    // Borramos usando el ID del mensaje
                    await client.sendMessage(m.chat, { delete: msg.key });
                    
                    // IMPORTANTE: Si el mensaje que borramos estaba en nuestra memoria de main.js, 
                    // lo quitamos de ahí también para que no cause errores después.
                    if (client.messages[m.chat]) {
                        client.messages[m.chat].array = client.messages[m.chat].array.filter(v => v.key.id !== msg.key.id);
                    }
                } catch (err) {
                    continue; // Si falla uno, seguimos con el siguiente
                }
            }

            // Mensaje final silencioso
            return client.reply(m.chat, `✅ Limpieza completada.`, m);

        } catch (e) {
            console.log("ERROR EN CLEAN:", e);
            return await client.sendMessage(m.chat, { delete: m.key });
        }
    }
};

export default clean;
