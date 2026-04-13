import { resolveLidToRealJid } from "../../core/utils.js"

export default {
    command: ['quitarplata', 'removerdinero', 'debt'],
    category: 'economy',
    run: async (client, m, args, usedPrefix, command) => {
        const db = global.db.data
        const chatId = m.chat
        const sender = m.sender
        const botId = client.user.id.split(':')[0] + '@s.whatsapp.net'

        // 1. SEGURIDAD (Solo Dueño o el Bot)
        const settings = db.settings[botId] || {}
        const isOwners = [
            botId, 
            ...(settings.owner ? [settings.owner] : []), 
            ...global.owner.map(num => num + '@s.whatsapp.net')
        ].map(v => client.decodeJid(v)).includes(client.decodeJid(sender))

        if (!isOwners && !m.key.fromMe) {
            return m.reply(`《✧》 Solo mi dueño puede aplicar multas. ♡`)
        }

        // 2. VALIDACIÓN DE ARGUMENTOS
        const mentioned = m.mentionedJid || []
        const who2 = mentioned[0] || (m.quoted ? m.quoted.sender : null)
        const who = await resolveLidToRealJid(who2, client, m.chat)
        
        const amountToQuitar = parseInt(args.find(a => !isNaN(a)))

        if (!who || isNaN(amountToQuitar) || amountToQuitar <= 0) {
            return m.reply(`「✿」 *Uso Correcto* ◢\n\n➩ Escribe: *${usedPrefix + command} @user [cantidad]*\n➩ Ejemplo: *${usedPrefix + command} @usuario 50000* ꕤ`)
        }

        const user = db.chats[chatId].users[who]
        if (!user) return m.reply(`《✧》 El usuario no está registrado en este grupo.`)

        // Inicializar variables si no existen
        user.coins = user.coins || 0
        user.bank = user.bank || 0
        let remainingDebt = amountToQuitar

        // 3. LÓGICA DE COBRO EN CASCADA
        
        // Paso A: Cobrar de las monedas en mano (Permite quedar en negativo)
        user.coins -= remainingDebt
        
        // Paso B: Si el saldo quedó en negativo, intentamos saldar con el banco
        if (user.coins < 0) {
            let deudaActual = Math.abs(user.coins)
            
            if (user.bank > 0) {
                if (user.bank >= deudaActual) {
                    // El banco cubre TODA la deuda
                    user.bank -= deudaActual
                    user.coins = 0
                } else {
                    // El banco cubre solo una PARTE y queda en 0
                    deudaActual -= user.bank
                    user.bank = 0
                    user.coins = -deudaActual
                }
            }
        }

        const targetName = db.users[who]?.name || who.split('@')[0]
        const currency = settings.currency || 'Yenes'

        // 4. RESPUESTA DINÁMICA
        let mensaje = `「✿」 *MULTA PROCESADA* ◢\n\n`
        mensaje += `➩ Usuario: *${targetName}*\n`
        mensaje += `➩ Cantidad quitada: *¥${amountToQuitar.toLocaleString()} ${currency}*\n\n`
        mensaje += `*ESTADO DE CUENTA:* ◢\n`
        mensaje += `➩ Banco: *¥${user.bank.toLocaleString()}* (Protegido en 0)\n`
        
        if (user.coins < 0) {
            mensaje += `➩ Efectivo: *¥${user.coins.toLocaleString()}* ⚠️ *(Deuda)*`
        } else {
            mensaje += `➩ Efectivo: *¥${user.coins.toLocaleString()}*`
        }

        return await client.sendMessage(chatId, { text: mensaje, mentions: [who] }, { quoted: m })
    },
}
