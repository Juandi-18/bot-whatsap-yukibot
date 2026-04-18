import { resolveLidToRealJid } from "../../core/utils.js"

const growth = Math.pow(Math.PI / Math.E, 1.618) * Math.E * 0.75

function xpRange(level, multiplier = global.multiplier || 2) {
    if (level < 0) throw new TypeError('level cannot be negative value')
    level = Math.floor(level)
    const min = level === 0 ? 0 : Math.round(Math.pow(level, growth) * multiplier) + 1
    const max = Math.round(Math.pow(level + 1, growth) * multiplier)
    return { min, max, xp: max - min }
}

export default {
    command: ['level', 'lvl', 'nivel'],
    category: 'profile',
    run: async (client, m, args) => {
        const db = global.db.data
        const chatId = m.chat
        
        // 1. Identificar al usuario (Mención, Respuesta o uno mismo)
        const mentioned = m.mentionedJid || []
        const who2 = mentioned.length > 0 ? mentioned[0] : (m.quoted ? m.quoted.sender : m.sender)
        const who = await resolveLidToRealJid(who2, client, chatId)
        
        const user = db.users[who]
        if (!user) return m.reply(`「✎」 El usuario no está registrado en mi base de datos. ♡`)

        // 2. Cálculo de Ranking
        const users = Object.entries(db.users).map(([key, value]) => ({ ...value, jid: key }))
        const sortedLevel = users.sort((a, b) => (b.level || 0) - (a.level || 0) || (b.exp || 0) - (a.exp || 0))
        const rank = sortedLevel.findIndex(u => u.jid === who) + 1

        // 3. Cálculos de Experiencia y Progreso
        const { min, max, xp } = xpRange(user.level || 0, global.multiplier)
        
        // Aseguramos que el progreso no sea negativo
        const progresoActual = Math.max(0, (user.exp || 0) - min)
        const porcentaje = Math.min(100, Math.floor((progresoActual / xp) * 100))

        // 4. Diseño con gatitos y barra de progreso visual
        const barra = '■'.repeat(Math.floor(porcentaje / 10)) + '□'.repeat(10 - Math.floor(porcentaje / 10))

        const txt = `﹒⌗﹒🌿 .ৎ˚₊‧  *PERFIL DE NIVEL* ♡

✿ *Usuario:* @${who.split('@')[0]}
❖ *Nivel:* ${user.level || 0}
☆ *Experiencia:* ${(user.exp || 0).toLocaleString()}
✐ *Puesto:* #${rank} en el Top
❒ *Comandos:* ${(user.usedcommands || 0).toLocaleString()}

➨ *Progreso:* [${barra}] *${porcentaje}%*
> Falta *${(max - (user.exp || 0)).toLocaleString()}* de XP para el nivel ${ (user.level || 0) + 1 } ꕤ`

        return await client.sendMessage(chatId, { 
            text: txt, 
            mentions: [who] 
        }, { quoted: m })
    }
}
