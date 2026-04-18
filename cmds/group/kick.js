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
        const botId = client.decodeJid(client.user.id)
        
        // Obtenemos la lista de dueños configurada en global.owner
        const ownersBot = global.owner.map(num => num.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
        
        // ¿Quién es el que está ejecutando el comando?
        const isSenderOwner = ownersBot.includes(m.sender) || m.sender === botId
        
        // ¿El objetivo es un Admin?
        const participantObj = groupInfo.participants.find(p => p.id === user)
        const isTargetAdmin = participantObj?.admin !== null

        // --- 🛡️ PROTECCIONES ---

        // Caso 1: No expulsar a los Dueños del Bot (Owners)
        if (ownersBot.includes(user)) {
            return m.reply('《✧》 No puedo expulsar a mi creador. ¡Eso sería traición! ♡')
        }

        // Caso 2: No expulsar al Dueño del Grupo (Creador del chat)
        if (user === ownerGroup) {
            return m.reply('《✧》 No puedo expulsar al dueño del grupo. ♡')
        }

        // Caso 3: El Bot a sí mismo
        if (user === botId) {
            return m.reply('「✿」 ¿Intentas que me vaya? Usa !out si quieres que me retire. ꕤ')
        }

        // Caso 4: Otros Administradores (LOGICA MODIFICADA)
        if (isTargetAdmin) {
            // Si el que ordena NO es el dueño ni el bot, bloqueamos la expulsión
            if (!isSenderOwner) {
                return m.reply('《✧》 No puedo eliminar a otro Administrador. Solo mi Creador tiene el poder de hacer eso. ♡')
            }
            // Si el que ordena ES dueño o bot, el código sigue adelante y lo expulsa
        }

        // 2. EJECUCIÓN
        try {
            if (!participantObj) {
                return client.reply(m.chat, `《✧》 *@${user.split('@')[0]}* ya no está en el grupo. ♡`, m, { mentions: [user] })
            }

            await client.groupParticipantsUpdate(m.chat, [user], 'remove')
            client.reply(m.chat, `「✿」 Usuario @${user.split('@')[0]} *eliminado* por orden superior. ◢`, m, { mentions: [user] })

        } catch (e) {
            console.error(e)
            return m.reply(`《✧》 Ocurrió un error inesperado al intentar eliminar al usuario. ♡`)
        }
    },
};
