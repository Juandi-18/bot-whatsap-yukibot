const onlyowner = {
    command: ['onlyowner', 'modoprivado'],
    category: 'owner',
    // Mantenemos esto por seguridad del motor del bot
    isOwner: true, 
    run: async (client, m, args, usedPrefix, command) => {
        const botJid = client.user.id.split(':')[0] + '@s.whatsapp.net';
        const sender = m.sender;

        // 1. DEFINIR QUIÉNES SON LOS DUEÑOS
        const settings = global.db.data.settings[botJid] || {};
        const isOwners = [
            botJid, 
            ...(settings.owner ? [settings.owner] : []), 
            ...global.owner.map(num => num + '@s.whatsapp.net')
        ].includes(sender);

        const isBot = m.key.fromMe; // Verifica si el mensaje viene del propio bot

        // 2. VALIDACIÓN DE SEGURIDAD
        if (!isOwners && !isBot) {
            return client.reply(m.chat, `《✧》 *Error de permisos*\nSolo mi dueño o yo podemos usar este comando. ♡`, m);
        }

        // 3. LÓGICA DEL COMANDO
        if (!args || args.length === 0 || !args[0]) {
            return client.reply(m.chat, `「✿」*Modo Privado* ◢\n\n➩ *Estado ›* ${settings.onlyOwnerMode ? 'Activado' : 'Desactivado'}\n\nꕤ *Uso correcto:*\n> *${usedPrefix + command} on*\n> *${usedPrefix + command} off*`, m);
        }

        const choice = args[0].toLowerCase();

        if (choice === 'on') {
            // Verificamos si ya estaba activado
            if (settings.onlyOwnerMode === true) {
                return client.reply(m.chat, `《✧》 El Modo Privado *ya estaba Activado*. ♡`, m);
            }
            settings.onlyOwnerMode = true;
            return await client.reply(m.chat, `「✿」*Modo Privado Activado* ◢\n\n➩ Ahora solo responderé a mis dueños. ♡`, m);
            
        } else if (choice === 'off') {
            // Verificamos si ya estaba desactivado
            if (!settings.onlyOwnerMode) {
                return client.reply(m.chat, `《✧》 El Modo Privado *ya estaba Desactivado*. ♡`, m);
            }
            settings.onlyOwnerMode = false;
            return await client.reply(m.chat, `「✿」*Modo Privado Desactivado* ◢\n\n➩ Ahora le responderé a todos. ♡`, m);
            
        } else {
            return client.reply(m.chat, `ꕤ Opción no válida. Por favor, usa *on* o *off*.`, m);
        }

        // Guardar cambios en la base de datos
        global.db.data.settings[botJid] = settings;
    }
};

export default onlyowner;
