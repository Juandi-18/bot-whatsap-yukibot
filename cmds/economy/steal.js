import { resolveLidToRealJid } from "../../core/utils.js"

export default {
    command: ['robar', 'steal', 'rob'],
    category: 'economy',
    run: async (client, m, args, usedPrefix, command) => {
        const db = global.db.data
        const chatId = m.chat
        const chatData = db.chats[chatId]

        if (chatData.adminonly || !chatData.economy) {
            return m.reply(`ꕥ Los comandos de *Economía* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con el comando:\n» *${usedPrefix}economy on*`)
        }

        const botId = client.user.id.split(':')[0] + '@s.whatsapp.net'
        const botSettings = db.settings[botId] || {}
        const currency = botSettings.currency || 'Yenes'
        
        const user = chatData.users[m.sender]
        user.coins ||= 0
        user.laststeal ||= 0

        // 1. COOLDOWN DEL LADRÓN (1 Hora entre cada intento de robo)
        if (Date.now() < user.laststeal) {
            const restante = user.laststeal - Date.now()
            return client.reply(m.chat, `《✧》 Debes esperar *${formatTime(restante)}* para volver a intentar un atraco. ♡`, m)
        }

        const mentioned = m.mentionedJid || []
        const who2 = mentioned[0] || (m.quoted ? m.quoted.sender : null)
        const who = await resolveLidToRealJid(who2, client, m.chat)

        if (!who) return client.reply(m.chat, `❀ Menciona o responde al mensaje de alguien para robarle.`, m)
        if (who === m.sender) return m.reply(`《✧》 No puedes robarte a ti mismo, pícaro. ♡`)
        
        if (!chatData.users[who]) {
            return client.reply(m.chat, `ꕥ El usuario no está registrado en este grupo.`, m)
        }

        const target = chatData.users[who]
        const targetName = db.users[who]?.name || who.split('@')[0]

        // 2. PROTECCIÓN DE 1 HORA (Inactividad)
        // Gracias a tu main.js, lastCmd se actualiza con CADA mensaje
        const lastActivity = target.lastCmd || 0
        const tiempoDesdeUltimoMensaje = Date.now() - lastActivity

        if (tiempoDesdeUltimoMensaje < 3600000) { // 3600000 ms = 1 hora
            return client.reply(m.chat, `「✿」 *OBJETIVO PROTEGIDO* ◢\n\n➩ No puedes robarle a *${targetName}* porque ha estado activo recientemente.\n➩ Debe estar inactivo por lo menos 1 hora para poder robarle. ꕤ`, m, { mentions: [who] })
        }

        // 3. VALIDACIÓN DE DINERO EN MANO (Solo coins, no bank)
        if (!target.coins || target.coins < 500) {
            return client.reply(m.chat, `ꕥ *${targetName}* no tiene suficientes *${currency}* fuera del banco. ¡No hay nada que robar!`, m, { mentions: [who] })
        }

        user.laststeal = Date.now() + 3600000 // Cooldown de 1 hora para el ladrón
        const chance = Math.random()

        // 4. LÓGICA DE FALLO (30% de probabilidad de fallar)
        if (chance < 0.3) {
            let loss = Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000
            if (user.coins < loss) loss = user.coins 
            
            user.coins -= loss
            return client.reply(m.chat, `「✿」 ¡EL ROBO SALIÓ MAL! ◢\n\n➩ *${targetName}* te atrapó con las manos en la masa y perdiste *¥${loss.toLocaleString()} ${currency}*. ꕤ`, m)
        }

        // 5. LÓGICA DE ÉXITO (70% de probabilidad)
        // Roba una cantidad aleatoria entre 4000 y 8000
        let rob = Math.floor(Math.random() * (8000 - 4000 + 1)) + 4000
        if (rob > target.coins) rob = target.coins // No puede robar más de lo que la víctima tiene en mano

        user.coins += rob
        target.coins -= rob

        return client.reply(m.chat, `「✿」 ¡ATRACO EXITOSO! ◢\n\n➩ Has logrado robarle *¥${rob.toLocaleString()} ${currency}* a *${targetName}*. ꕤ\n➩ ¡Corre antes de que se despierte!`, m, { mentions: [who] })
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
