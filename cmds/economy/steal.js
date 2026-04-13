import { resolveLidToRealJid } from "../../core/utils.js"

export default {
    command: ['robar', 'steal', 'rob'],
    category: 'economy',
    run: async (client, m, args, usedPrefix, command) => {
        const db = global.db.data
        const chatId = m.chat
        const chatData = db.chats[chatId]

        if (chatData.adminonly || !chatData.economy) {
            return m.reply(`ꕥ Los comandos de *Economía* están desactivados.\n\nUsa: *${usedPrefix}economy on*`)
        }

        const botId = client.user.id.split(':')[0] + '@s.whatsapp.net'
        const botSettings = db.settings[botId] || {}
        const currency = botSettings.currency || 'Yenes'
        
        const user = chatData.users[m.sender]
        user.coins ||= 0
        user.laststeal ||= 0

        // 1. COOLDOWN DEL LADRÓN (Para que no robe a cada rato)
        if (Date.now() < user.laststeal) {
            const restante = user.laststeal - Date.now()
            return client.reply(m.chat, `《✧》 Debes esperar *${formatTime(restante)}* para volver a intentar un atraco. ♡`, m)
        }

        const mentioned = m.mentionedJid || []
        const who2 = mentioned[0] || (m.quoted ? m.quoted.sender : null)
        const who = await resolveLidToRealJid(who2, client, m.chat)

        if (!who) return client.reply(m.chat, `❀ Menciona o responde al mensaje de alguien para robarle.`, m)
        if (who === m.sender) return m.reply(`《✧》 No puedes robarte a ti mismo. ♡`)
        
        if (!chatData.users[who]) {
            return client.reply(m.chat, `ꕥ El usuario no está registrado en la base de datos.`, m)
        }

        const target = chatData.users[who]
        const targetName = db.users[who]?.name || who.split('@')[0]

        // 2. PROTECCIÓN DE 1 HORA (Inactividad)
        // Usamos lastCmd que se actualiza en tu main.js cada vez que alguien escribe
        const lastActivity = target.lastCmd || 0
        const tiempoDesdeUltimoMensaje = Date.now() - lastActivity

        if (tiempoDesdeUltimoMensaje < 3600000) { // 1 hora en milisegundos
            return client.reply(m.chat, `「✿」 *OBJETIVO PROTEGIDO* ◢\n\n➩ No puedes robarle a *${targetName}* porque ha estado activo recientemente.\n➩ Debe estar inactivo por lo menos 1 hora. ꕤ`, m, { mentions: [who] })
        }

        // 3. VALIDACIÓN DE DINERO FUERA DEL BANCO
        if (!target.coins || target.coins < 500) {
            return client.reply(m.chat, `ꕥ *${targetName}* tiene sus *${currency}* bien guardados en el banco o está pobre. ¡No hay nada que robar!`, m, { mentions: [who] })
        }

        user.laststeal = Date.now() + 3600000 // Seteamos cooldown de 1 hora al ladrón
        const chance = Math.random()

        // 4. LÓGICA DE FALLO (El ladrón pierde dinero)
        if (chance < 0.3) {
            let loss = Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000
            if (user.coins < loss) loss = user.coins // No puede perder más de lo que tiene en mano
            
            user.coins -= loss
            return client.reply(m.chat, `「✿」 ¡EL ROBO SALIÓ MAL! ◢\n\n➩ *${targetName}* te descubrió y la policía te multó con *¥${loss.toLocaleString()} ${currency}*. ꕤ`, m)
        }

        // 5. LÓGICA DE ÉXITO
        // Roba un porcentaje del dinero que tiene la víctima en mano (máximo 8000)
        let rob = Math.floor(Math.random() * (8000 - 4000 + 1)) + 4000
        if (rob > target.coins) rob = target.coins

        user.coins += rob
        target.coins -= rob

        return client.reply(m.chat, `「✿」 ¡ATRACO EXITOSO! ◢\n\n➩ Le has quitado *¥${rob.toLocaleString()} ${currency}* a *${targetName}*. ꕤ\n➩ ¡Corre antes de que se de cuenta!`, m, { mentions: [who] })
    }
}

function formatTime(ms) {
    const totalSec = Math.ceil(ms / 1000)
    const hours = Math.floor(totalSec / 3600)
    const minutes = Math.floor((totalSec % 3600) / 60)
    const seconds = totalSec % 60
    const parts = []
    if (hours) parts.push(`${hours}h`)
    if (minutes) parts.push(`${minutes}m`)
    if (seconds) parts.push(`${seconds}s`)
    return parts.join(' ')
}
