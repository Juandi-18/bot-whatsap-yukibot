export default {
    command: ['rt', 'roulette', 'ruleta'],
    category: 'rpg',
    run: async (client, m, args, usedPrefix) => {
        const db = global.db.data
        const chatId = m.chat
        const senderId = m.sender
        const botId = client.user.id.split(':')[0] + '@s.whatsapp.net'
        const botSettings = db.settings[botId]
        const chatData = db.chats[chatId]

        if (chatData.adminonly || !chatData.economy) {
            return m.reply(`ꕥ Los comandos de *Economía* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con el comando:\n» *${usedPrefix}economy on*`)
        }

        const user = chatData.users[m.sender]
        const currency = botSettings.currency || 'Yenes'
        
        // 1. VALIDACIÓN DE ARGUMENTOS
        if (args.length < 2) {
            return m.reply(`「✿」 *¿Cómo apostar?* ◢\n\n➩ Uso: *${usedPrefix}rt [cantidad] [color]*\n➩ Colores: *red, black* ꕤ`)
        }

        let amount, color
        if (!isNaN(parseInt(args[0]))) {
            amount = parseInt(args[0])
            color = args[1].toLowerCase()
        } else if (!isNaN(parseInt(args[1]))) {
            color = args[0].toLowerCase()
            amount = parseInt(args[1])
        } else {
            return m.reply(`《✧》 Formato inválido. Ejemplo: *rt 2000 black* ♡`)
        }

        // 2. FILTRO DE COLORES Y CANTIDAD
        const validColors = ['red', 'black']
        if (!validColors.includes(color)) {
            return m.reply(`《✧》 Color inválido. Solo puedes apostar a: *red* o *black*. ♡`)
        }

        if (isNaN(amount) || amount < 200) {
            return m.reply(`《✧》 La cantidad mínima de ${currency} es 200.`)
        }

        if (user.coins < amount) {
            return m.reply(`《✧》 No tienes suficientes *${currency}* para esta apuesta.`)
        }

        // 3. LÓGICA DE RESULTADO
        const resultColor = validColors[Math.floor(Math.random() * validColors.length)]

        if (resultColor === color) {
            const reward = amount * 2
            user.coins += (reward - amount) 
            
            // MENSAJE DE GANADOR PERSONALIZADO
            return await client.sendMessage(chatId, { 
                text: `「✿」 La ruleta salió en *${resultColor}* y has ganado *¥${reward.toLocaleString()} ${currency}*.`, 
                mentions: [senderId] 
            }, { quoted: m })
        } else {
            user.coins -= amount
            
            // MENSAJE DE PERDEDOR PERSONALIZADO
            return await client.sendMessage(chatId, { 
                text: `「✿」 La ruleta salió en *${resultColor}* y has perdido *¥${amount.toLocaleString()} ${currency}*.`, 
                mentions: [senderId] 
            }, { quoted: m })
        }
    },
}
