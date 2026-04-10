const onlyowner = {
    command: ['onlyowner', 'solodueño', 'privatebot'],
    category: 'owner',
    isOwner: true, // Solo tú puedes usar este comando para activarlo
    run: async (client, m, { args, usedPrefix, command }) => {
        const botJid = client.user.id.split(':')[0] + '@s.whatsapp.net';
        const settings = global.db.data.settings[botJid] || {};

        if (!args[0]) return client.reply(m.chat, `⚠️ Modo de uso:\n*${usedPrefix + command} on* (Activar)\n*${usedPrefix + command} off* (Desactivar)`, m);

        if (args[0] === 'on') {
            settings.onlyOwnerMode = true;
            await client.reply(m.chat, `✅ **Modo Privado Activo**\nAhora solo el dueño y el bot pueden usar los comandos.`, m);
        } else if (args[0] === 'off') {
            settings.onlyOwnerMode = false;
            await client.reply(m.chat, `✅ **Modo Privado Desactivado**\nAhora todos los usuarios pueden usar el bot.`, m);
        }
        
        global.db.data.settings[botJid] = settings;
    }
};

export default onlyowner;
