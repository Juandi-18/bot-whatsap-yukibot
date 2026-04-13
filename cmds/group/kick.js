export default {
    command: ['kick', 'expulsar'],
    category: 'grupo',
    isAdmin: true,
    botAdmin: true,
    run: async (client, m, { args, usedPrefix, command }) => {
        // 1. VALIDACIÓN INICIAL
        if (!m.mentionedJid[0] && !m.quoted) {
            return m.reply('「✿」 *¿A quién desea eliminar?* ◢\n\n➩ Etiqueta a alguien o responde a su mensaje. ꕤ')
        }

        let user = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted.sender
        const groupInfo = await client.groupMetadata(m.chat)
        
        // Definición de IDs importantes
        const ownerGroup = groupInfo.owner || m.chat.split`-`[0] + '@s.whatsapp.net'
        const ownerBot = global.owner[0][0] + '@s.whatsapp.net'
        const botId = client.decodeJid(client.user.id)
        
        // Buscar si el usuario es Admin
        const isAdmin = groupInfo.participants.find(p => p.id === user)?.admin !== null

        // --- PROTECCIONES ---

        // Casos 1 y 2: Dueño del Bot o Dueño del Grupo
        if (user === ownerBot || user === ownerGroup) {
            return m.reply('《✧》 No puedo expulsar a mi creador o al dueño del grupo. ¡Eso sería traición! ♡')
        }

        // Caso 3: El Bot a sí mismo
        if (user === botId) {
            return m.reply('「✿」 ¿Intentas que me vaya? No puedo eliminarme a mí mismo del grupo. ꕤ')
        }

        // Caso 4: Otros Administradores (NUEVO)
        if (isAdmin) {
            return m.reply('《✧》 No puedo eliminar a otro Administrador. Por favor, quítale el rango primero. ♡')
        }

        // 2. EJECUCIÓN
        try {
            const participant = groupInfo.participants.find((p) => p.id === user)
            if (!participant) {
                return client.reply(m.chat, `《✧》 *@${user.split('@')[0]}* ya no está en el grupo.`, m, { mentions: [user] })
            }

            await client.groupParticipantsUpdate(m.chat, [user], 'remove')
            client.reply(m.chat, `「✿」 Usuario @${user.split('@')[0]} *eliminado* con éxito. ◢`, m, { mentions: [user] })

        } catch (e) {
            return m.reply(`《✧》 Ocurrió un error inesperado al intentar eliminar al usuario. ♡`)
        }
    },
};
