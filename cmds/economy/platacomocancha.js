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

        const isBot = m.key.fromMe

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

        // 3. LÓGICA DE INYECCIÓN (Limpia deuda automáticamente)
        const saldoAnterior = user.coins || 0
        user.coins = (user.coins || 0) + amount
        
        const currency = settings.currency || 'Yenes'

        // 4. MENSAJE DINÁMICO SEGÚN EL ESTADO DE CUENTA
        let mensaje = `「✿」 ¡PLATA COMO CANCHA! ◢\n\n`
        mensaje += `➩ Se han inyectado: *¥${amount.toLocaleString()} ${currency}*\n`

        if (saldoAnterior < 0) {
            if (user.coins >= 0) {
                mensaje += `✨ *¡Deuda Saldada!* La inyección cubrió tu saldo negativo. Ahora tienes *¥${user.coins.toLocaleString()}* a favor.`
            } else {
                mensaje += `⚠️ *Nota:* Aún inyectando esa cantidad, sigues debiendo *¥${Math.abs(user.coins).toLocaleString()}*. ¡Sigue inyectando, jefe!`
            }
        } else {
            mensaje += `➩ Nuevo saldo en mano: *¥${user.coins.toLocaleString()}*\n➩ Disfruta tus millones, jefe. ꕤ`
        }

        return await client.sendMessage(chatId, { 
            text: mensaje, 
            mentions: [sender] 
        }, { quoted: m })
    },
}
