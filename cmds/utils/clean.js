const clean = {
    command: ['clean', 'borrar', 'del'],
    category: 'utils',
    isAdmin: true,
    botAdmin: true,
    run: async (client, m, args, usedPrefix, command, text) => {
        let count = parseInt(args[0])
        if (isNaN(count) || count < 1) return client.reply(m.chat, `⚠️ Cantidad inválida.\nEjemplo: *${usedPrefix + command} 10*`, m)
        
        try {
            let fetch = await client.fetchMessagesFromWA(m.chat, count)
            for (let i = 0; i < fetch.length; i++) {
                await client.sendMessage(m.chat, { delete: fetch[i].key })
            }
        } catch (e) {
            return client.reply(m.chat, `❌ Error: El bot debe ser admin.`, m)
        }
    }
}

export default clean
