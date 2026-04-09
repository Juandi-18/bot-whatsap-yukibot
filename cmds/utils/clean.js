const clean = {
    command: ['clean', 'borrar', 'del'],
    category: 'utils',
    isAdmin: true,
    botAdmin: true,
    run: async (client, m, args, usedPrefix, command, text) => {
        const count = parseInt(args[0]);
        if (isNaN(count) || count < 1) return client.reply(m.chat, `⚠️ Cantidad inválida.\nEjemplo: *${usedPrefix + command} 10*`, m);
        
        // Forzamos actualización de metadatos para verificar que el bot es admin
        const groupMetadata = await client.groupMetadata(m.chat);
        const botJid = client.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotAdmin = groupMetadata.participants.some(p => p.id === botJid && (p.admin === 'admin' || p.admin === 'superadmin'));

        if (!isBotAdmin) return client.reply(m.chat, `❌ Error: Necesito ser administrador del grupo para borrar mensajes de otros.`, m);

        try {
            // Usamos un límite de seguridad
            const limit = count > 100 ? 100 : count;
            const fetch = await client.fetchMessagesFromWA(m.chat, limit);
            
            for (let i = 0; i < fetch.length; i++) {
                // Pequeña pausa para evitar que WhatsApp nos bloquee por spam de borrado
                await new Promise(resolve => setTimeout(resolve, 300)); 
                await client.sendMessage(m.chat, { delete: fetch[i].key });
            }
        } catch (e) {
            console.error(e);
            return client.reply(m.chat, `❌ Ocurrió un error al intentar borrar.`, m);
        }
    }
};

export default clean;
