import { resolveLidToRealJid } from "../../core/utils.js"

export default {
    command: ['quitarplata', 'removerdinero', 'debt'],
    category: 'economy',
    run: async (client, m, args, usedPrefix, command) => {
        const db = global.db.data
        const chatId = m.chat
        const sender = m.sender
        const botJid = client.user.id.split(':')[0] + '@s.whatsapp.net'

        // 1. SEGURIDAD (Solo Dueño o el Bot)
        const settings = db.settings[botJid] || {}
        const isOwners = [
            botJid, 
            ...(settings.owner ? [settings.owner] : []), 
            ...global.owner.map(num => num + '@s.whatsapp.net')
        ].map(v => client.decodeJid(v)).includes(client.decodeJid(sender))

        if (!isOwners && !m.key.fromMe) {
            return m.reply(`《✧》 Solo mi dueño puede aplicar multas o quitar dinero. ♡`)
        }

        // 2. VALIDACIÓN DE ARGUMENTOS
        const mentioned = m.mentionedJid || []
        const who2 = mentioned[0] || (m.quoted ? m.quoted.sender : null)
        const who = await resolveLidToRealJid(who2, client, m.chat)
        
        const amount = parseInt(args.find(a => !isNaN(a)))

        if (!who || isNaN(amount)) {
            return m.reply(`「✿」 *Uso Correcto* ◢\n\n➩ Escribe: *${usedPrefix + command} @user [cantidad]*\n➩ Ejemplo: *${usedPrefix + command} @usuario 5000* ꕤ`)
        }

        const user = db.chats[chatId].users[who]
        if (!user) return m.reply(`《✧》 El usuario no está en mi base de datos.`)

        // 3. QUITAR EL DINERO (Permitiendo negativos)
        user.coins = (user.coins || 0) - amount
        
        const targetName = db.users[who]?.name || who.split('@')[0]
        const currency = settings.currency || 'Yenes'

        // 4. RESPUESTA DINÁMICA
        let mensaje = `「✿」 *MULTA APLICADA* ◢\n\n➩ Se le han quitado *¥${amount.toLocaleString()} ${currency}* a *${targetName}*.\n`
        
        if (user.coins < 0) {
            mensaje += `⚠️ *Estado:* En deuda. Ahora debe trabajar para saldar sus *¥${Math.abs(user.coins).toLocaleString()}* en contra.`
        } else {
            mensaje += `➩ Saldo restante: *¥${user.coins.toLocaleString()}*`
        }

        return await client.sendMessage(chatId, { text: mensaje, mentions: [who] }, { quoted: m })
    },
}
