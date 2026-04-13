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

        if (chatData.adminonly || !chatData.economy) return m.reply(`ꕥ Los comandos de *Economía* están desactivados en este grupo.`)
        
        const mentioned = m.mentionedJid || []
        const who2 = m.quoted ? m.quoted.sender : mentioned[0] || (args[1] ? (args[1].replace(/[@ .+-]/g, '') + '@s.whatsapp.net') : '')
        if (!who2) return m.reply(`❀ Debes mencionar a quien quieras transferir *${monedas}*.\n> Ejemplo » *${usedPrefix + command} 25000 @mencion*`)
        
        const who = await resolveLidToRealJid(who2, client, m.chat)
        const senderData = chatData.users[m.sender]
        const targetData = chatData.users[who]
        
        if (!targetData) return m.reply(`ꕥ El usuario mencionado no está registrado en el bot.`)

        const cantidadInput = args[0]?.toLowerCase()
        let cantidad = cantidadInput === 'all' ? (senderData.bank || 0) : parseInt(cantidadInput)

        if (!cantidadInput || isNaN(cantidad) || cantidad <= 0) {
            return m.reply(`ꕥ Ingresa una cantidad válida de *${monedas}* para transferir.`)
        }

        if ((senderData.bank || 0) < cantidad) {
            return m.reply(`ꕥ No tienes suficientes *${monedas}* en el banco para transferir.\n> Tu saldo actual: *¥${(senderData.bank || 0).toLocaleString()} ${monedas}*`)
        }

        // --- LÓGICA DE TRANSFERENCIA AL BANCO CON LIMPIEZA DE DEUDA ---
        senderData.bank -= cantidad
        
        let montoParaTransferir = cantidad
        
        // A. Si el receptor tiene DEUDA (coins negativo)
        if ((targetData.coins || 0) < 0) {
            let deuda = Math.abs(targetData.coins)
            
            if (montoParaTransferir >= deuda) {
                // El dinero recibido es suficiente para pagar TODA la deuda
                targetData.coins = 0 // Deuda saldada
                montoParaTransferir -= deuda // Lo que sobra se irá al banco
            } else {
                // El dinero recibido solo reduce una parte de la deuda
                targetData.coins += montoParaTransferir
                montoParaTransferir = 0 // No sobró nada para el banco
            }
        }

        // B. El dinero sobrante (o todo, si no había deuda) va al BANCO
        targetData.bank = (targetData.bank || 0) + montoParaTransferir
        // -------------------------------------------------------------

        let name = global.db.data.users[who]?.name || who.split('@')[0]
        
        // Mantenemos tu mensaje original
        return await client.sendMessage(chatId, { 
            text: `❀ Transferiste *¥${cantidad.toLocaleString()} ${monedas}* a *${name}*\n> Ahora tienes *¥${senderData.bank.toLocaleString()} ${monedas}* en tu banco.`, 
            mentions: [who] 
        }, { quoted: m })
    }
}
