import { resolveLidToRealJid } from "../../core/utils.js"

export async function before(m, { client }) {
    const botJid = client.user.id.split(':')[0] + '@s.whatsapp.net'
    const chatData = global.db.data.chats[m.chat]
    if (!chatData) return
    
    const primaryBot = chatData.primaryBot
    if (primaryBot && botJid !== primaryBot) return 

    const currency = global.db.data.settings[botJid]?.currency || 'coins'
    const user = chatData.users[m.sender] ||= {}
    
    // --- LÓGICA PARA DESACTIVAR AFK AL VOLVER ---
    if (typeof user.afk === 'number' && user.afk > -1) {
        const ms = Date.now() - user.afk
        const minutos = Math.floor(ms / 60000)
        const horas = Math.floor(ms / 3600000)
        
        // Cálculo de recompensa
        let coins = minutos * 8
        const bonos = Math.floor(horas / 3)
        for (let i = 0; i < bonos; i++) {
            coins += Math.floor(Math.random() * (1500 - 300 + 1)) + 300
        }
        
        user.coins = (user.coins || 0) + coins
        const tiempo = formatTiempo(ms)
        const motivo = user.afkReason || 'sin especificar'
        const nombre = global.db.data.users[m.sender]?.name || m.pushName || 'Usuario'
        
        const recompensa = coins > 0 ? `\n> ○ Recompensa » *${coins.toLocaleString()} ${currency}*` : ''

        // MANDAMOS EL MENSAJE
        await client.reply(m.chat, `ꕥ *${nombre}* Dejaste de estar inactivo.\n> ○ Motivo » *${motivo}*\n> ○ Tiempo inactivo » *${tiempo}* ${recompensa}`, m)
        
        // !!! IMPORTANTE: LIMPIAMOS LOS DATOS DESPUÉS DEL MENSAJE !!!
        user.afk = -1
        user.afkReason = ''
        return // Detenemos aquí para que no se procese como una mención a otro AFK
    }

    // --- LÓGICA PARA AVISAR QUE ALGUIEN ESTÁ AFK (MENCIONES) ---
    const mentioned = m.mentionedJid || []
    const quoted = m.quoted ? m.quoted.sender : null
    let jids = []
    
    if (mentioned.length) {
        for (const id of mentioned) {
            const real = await resolveLidToRealJid(id, client, m.chat)
            if (real) jids.push(real)
        }
    }
    if (quoted) {
        const real = await resolveLidToRealJid(quoted, client, m.chat)
        if (real) jids.push(real)
    }

    jids = [...new Set(jids.filter(j => j && j !== m.sender))] // No avisar si yo mismo me menciono

    for (const jid of jids) {
        const target = chatData.users[jid]
        if (!target || typeof target.afk !== 'number' || target.afk < 0) continue
        
        const ms = Date.now() - target.afk
        const tiempo = formatTiempo(ms)
        const targetName = global.db.data.users[jid]?.name || 'Usuario'
        
        return await client.reply(m.chat, `ꕥ El usuario *${targetName}* está AFK.\n> ○ Motivo » *${target.afkReason || 'sin especificar'}*\n> ○ Tiempo inactivo » *${tiempo}*`, m)
    }
}

function formatTiempo(ms) {
    if (typeof ms !== 'number' || isNaN(ms)) return 'desconocido'
    const h = Math.floor(ms / 3600000)
    const min = Math.floor((ms % 3600000) / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    const parts = []
    if (h) parts.push(`${h} ${h === 1 ? 'hora' : 'horas'}`)
    if (min) parts.push(`${min} ${min === 1 ? 'minuto' : 'minutos'}`)
    if (s || (!h && !min)) parts.push(`${s} ${s === 1 ? 'segundo' : 'segundos'}`)
    return parts.join(' ')
}
