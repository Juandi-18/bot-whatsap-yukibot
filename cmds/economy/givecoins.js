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

        // 2. VALIDAR CANTIDAD (Saca del banco del emisor)
        const cantidadInput = args[0]?.toLowerCase()
        let cantidad = cantidadInput === 'all' ? (senderData.bank || 0) : parseInt(cantidadInput)

        if (!cantidadInput || isNaN(cantidad) || cantidad <= 0) {
            return m.reply(`ꕥ Ingresa una cantidad válida para transferir.`)
        }

        if ((senderData.bank || 0) < cantidad) {
            return m.reply(`ꕥ No tienes suficientes *${monedas}* en el banco.\n> Saldo bancario: *¥${(senderData.bank || 0).toLocaleString()}*`)
        }

        // 3. LÓGICA DE TRANSFERENCIA (Limpiador de Deuda)
        senderData.bank -= cantidad // Restamos del banco del que envía
        
        // Sumamos a COINS (efectivo) del que recibe para que descuente la deuda
        const saldoAnterior = targetData.coins || 0
        targetData.coins = (targetData.coins || 0) + cantidad

        // 4. RESPUESTA Y NOTIFICACIÓN DE DEUDA
        let name = global.db.data.users[who]?.name || who.split('@')[0]
        let mensaje = `「✿」 *TRANSFERENCIA EXITOSA* ◢\n\n`
        mensaje += `➩ Enviaste: *¥${cantidad.toLocaleString()} ${monedas}*\n`
        mensaje += `➩ Destinatario: *${name}*\n`
        mensaje += `➩ Tu nuevo saldo banco: *¥${senderData.bank.toLocaleString()}*\n\n`

        // Si el usuario tenía deuda (saldo negativo)
        if (saldoAnterior < 0) {
            if (targetData.coins >= 0) {
                mensaje += `✨ *Nota:* El dinero recibido cubrió la deuda de *${name}* y ahora tiene saldo positivo.`
            } else {
                mensaje += `⚠️ *Nota:* El dinero redujo la deuda de *${name}*, pero aún debe *¥${Math.abs(targetData.coins).toLocaleString()}* .`
            }
        }

        return await client.sendMessage(chatId, { text: mensaje, mentions: [who] }, { quoted: m })
    }
}
