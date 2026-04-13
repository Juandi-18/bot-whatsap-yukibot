export default {
    command: ['platacomocancha'],
    category: 'economy',
    run: async (client, m, args, usedPrefix) => {
        const db = global.db.data
        const chatId = m.chat
        const sender = m.sender
        const botJid = client.user.id.split(':')[0] + '@s.whatsapp.net'

        // 1. FILTRO DE SEGURIDAD ABSOLUTO (Solo Dueño o el Bot)
        const settings = db.settings[botJid] || {}
        const isOwners = [
            botJid, 
            ...(settings.owner ? [settings.owner] : []), 
            ...global.owner.map(num => num + '@s.whatsapp.net')
        ].map(v => client.decodeJid(v)).includes(client.decodeJid(sender))

        const isBot = m.key.fromMe // Verifica si el mensaje lo envió el bot

        if (!isOwners && !isBot) {
            return client.reply(m.chat, `《✧》 No tienes el rango de "Plata como cancha" para usar esto. Solo mi dueño puede. ♡`, m)
        }

        // 2. VALIDACIÓN DE CANTIDAD
        if (!args[0] || isNaN(parseInt(args[0]))) {
            return m.reply(`「✿」 *¿Cuánta plata, jefe?* ◢\n\n➩ Uso: *${usedPrefix}platacomocancha [cantidad]*\n➩ Ejemplo: *${usedPrefix}platacomocancha 1000000* ꕤ`)
        }

        const amount = parseInt(args[0])
        const chatData = db.chats[chatId]
        const user = chatData.users[sender]

        if (!user) {
            return m.reply(`《✧》 Error: No se encontró tu perfil de usuario en este grupo.`)
        }

        // 3. APLICAR EL DINERO (En la variable coins de la ruleta)
        user.coins = (user.coins || 0) + amount
        
        const currency = settings.currency || 'Yenes'

        return await client.sendMessage(chatId, { 
            text: `「✿」 ¡PLATA COMO CANCHA! ◢\n\n➩ Se han inyectado *¥${amount.toLocaleString()} ${currency}* a la cuenta.\n➩ Disfruta tus millones, jefe. ꕤ`, 
            mentions: [sender] 
        }, { quoted: m })
    },
}
