const onlyowner = {
    command: ['onlyowner', 'modoprivado'],
    category: 'owner',
    isOwner: true, // Solo los dueños actuales pueden activarlo/desactivarlo
    run: async (client, m, { args, usedPrefix, command }) => {
        const botJid = client.user.id.split(':')[0] + '@s.whatsapp.net';
        
        // Accedemos a la configuración global del bot
        if (!global.db.data.settings[botJid]) global.db.data.settings[botJid] = {};
        const settings = global.db.data.settings[botJid];

        if (!args[0]) return client.reply(m.chat, `*¿Qué deseas hacer?*\n\n» *${usedPrefix + command} on* (Solo dueños)\n» *${usedPrefix + command} off* (Todos)`, m);

        if (args[0] === 'on') {
            settings.onlyOwnerMode = true;
            await client.reply(m.chat, `🔒 **Modo Privado: ACTIVADO**\n\nAhora el bot ignorará a cualquier usuario que no sea Dueño.`, m);
        } else if (args[0] === 'off') {
            settings.onlyOwnerMode = false;
            await client.reply(m.chat, `🔓 **Modo Privado: DESACTIVADO**\n\nEl bot vuelve a ser público para todos.`, m);
        }
    }
};

export default onlyowner;
