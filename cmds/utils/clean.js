let handler = async (m, { conn, text, usedPrefix, command, isAdmin, isBotAdmin }) => {
    if (!text) return conn.reply(m.chat, `⚠️ ingrese la cantidad de mensajes a eliminar *${usedPrefix + command} + [cantidad]*`, m)
    
    let count = parseInt(text)
    if (isNaN(count) || count < 1) return conn.reply(m.chat, `❌ Número inválido.`, m)
    
    if (!m.isGroup) return conn.reply(m.chat, '《✧》 Solo grupos.', m)
    if (!isAdmin) return conn.reply(m.chat, '《✧》 Solo admins.', m)
    if (!isBotAdmin) return conn.reply(m.chat, '《✧》 El Bot debe ser admin.', m)

    try {
        let messages = await conn.loadMessages(m.chat, count)
        for (let msg of messages) {
            await conn.sendMessage(m.chat, { delete: msg.key })
        }
        conn.reply(m.chat, `✅ *Limpieza completada*`, m)
    } catch (e) {
        conn.reply(m.chat, `❌ Error al borrar.`, m)
    }
}

handler.help = ['clean <cantidad>']
handler.tags = ['utils'] // Si los otros archivos de esa carpeta dicen 'tools' o 'main', cambia esto a lo que digan ellos
handler.command = ['clean'] 
handler.group = true 
handler.admin = true
handler.botAdmin = true

export default handler