export default {
    command: ['revoke', 'restablecer', 'resetlink'],
    category: 'grupo',
    botAdmin: true,
    isAdmin: true, // Agregué esto para que solo los admins del grupo puedan resetear el link
    run: async (client, m, { usedPrefix, command }) => {
        try {
            await m.react('🕒');

            // 1. Revocamos el enlace actual
            await client.groupRevokeInvite(m.chat);

            // 2. Generamos el nuevo código de invitación
            const code = await client.groupInviteCode(m.chat);
            const link = `https://chat.whatsapp.com/${code}`;

            // 3. Diseño con gatitos y naturaleza
            const teks = `﹒⌗﹒🌿 .ৎ˚₊‧ El enlace del grupo ha sido restablecido con éxito. ♡\n\n𐚁 ֹ ִ  \`NEW GROUP LINK\` ! ୧ ֹ ִ🔗\n☘️ \`Solicitado por :\` @${m.sender.split('@')[0]}\n\n🌱 \`Enlace :\` ${link}\n\n✿ ¡Usa el nuevo link con sabiduría! ꕤ`.trim();

            // 4. Enviamos la respuesta (con mención al solicitante)
            await client.reply(m.chat, teks, m, { mentions: [m.sender] });

            // 5. Reacción final de éxito (Ahora sí se ejecutará)
            await m.react('✔️');

        } catch (e) {
            await m.react('✖️');
            console.error("ERROR EN REVOKE:", e);
            return m.reply(`《✧》 Ocurrió un error inesperado al restablecer el enlace. ♡\n> [Error: *${e.message}*]`);
        }
    },
};
