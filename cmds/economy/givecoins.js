import { resolveLidToRealJid } from "../../core/utils.js"

export default {
    command: ['givecoins', 'pay', 'coinsgive'],
    category: 'economy',
    group: true,
    run: async (client, m, args, usedPrefix, command) => {
        const db = global.db.data
        const chatId = m.chat
        const botId = client.user.id.split(':')[0] + '@s.whatsapp.net'
        const botSettings = db.settings[botId]
        const monedas = botSettings.currency || 'Yenes'
        const chatData = db.chats[chatId]

        if (chatData.adminonly || !chatData.economy) {
            return m.reply(`ꕥ Los comandos de *Economía* están desactivados en este grupo.`)
        }

        // 1. IDENTIFICAR AL RECEPTOR
        const mentioned = m.mentionedJid || []
        const who2 = m.quoted ? m.quoted.sender : mentioned[0] || (args[1] ? (args[1].replace(/[@ .+-]/g, '') + '@s.whatsapp.net') : '')
        if (!who2) return m.reply(`❀ Debes mencionar a quien quieras transferir *${monedas}*.\n> Ejemplo » *${usedPrefix + command} 25000 @mencion*`)
        
        const who = await resolveLidToRealJid(who2, client, m.chat)
        if (who === m.sender) return m.reply(`《✧》 No puedes transferirte dinero a ti mismo. ♡`)

        const senderData = chatData.users[m.sender]
        const targetData = chatData.users[who]
        if (!targetData) return m.reply(`ꕥ El usuario mencionado no está registrado.`)

        // 2. VALIDAR CANTIDAD
        const cantidadInput = args[0]?.toLowerCase()
        let cantidad = cantidadInput === 'all' ? (senderData.bank || 0) : parseInt(cantidadInput)

        if (!cantidadInput || isNaN(cantidad) || cantidad <= 0) {
            return m.reply(`ꕥ Ingresa una cantidad válida para transferir.`)
        }

        if ((senderData.bank || 0) < cantidad) {
            return m.reply(`ꕥ No tienes suficientes *${monedas}* en el banco para transferir.\n> Tu saldo actual: *¥${(senderData.bank || 0).toLocaleString()} ${monedas}*`)
        }

        // 3. PROCESO DE TRANSFERENCIA
        senderData.bank -= cantidad // Sale del banco del emisor
        
        // El dinero llega a 'coins' del receptor para saldar deuda si existe
        targetData.coins = (targetData.coins || 0) + cantidad

        // 4. MENSAJE FINAL (Exactamente como lo pediste)
        let name = global.db.data.users[who]?.name || who.split('@')[0]
        
        const textoFinal = `❀ Transferiste *¥${cantidad.toLocaleString()} ${monedas}* a *${name}*\n> Ahora tienes *¥${senderData.bank.toLocaleString()} ${monedas}* en tu banco.`

        return await client.sendMessage(chatId, { 
            text: textoFinal, 
            mentions: [who] 
        }, { quoted: m })
    }
}
