export default {
  command: [
    'welcome', 'bienvenida',
    'goodbye', 'despedida',
    'alerts', 'alertas',
    'nsfw',
    'antilink', 'antienlaces', 'antilinks',
    'rpg', 'economy', 'economia',
    'gacha',
    'adminonly', 'onlyadmin'
  ],
  category: 'grupo',
  isAdmin: true,
  run: async (client, m, args, usedPrefix, command) => {
    const botJid = client.user.id.split(':')[0] + "@s.whatsapp.net";
    const chatData = global.db.data.chats[m.chat];
    const settings = global.db.data.settings[botJid] || {};
    
    // --- LÓGICA DE PERMISOS RE-CORREGIDA (DUEÑO, BOT Y ADMINS REALES) ---
    const groupMetadata = m.isGroup ? await client.groupMetadata(m.chat).catch(() => null) : null;
    const participants = groupMetadata?.participants || [];
    const admins = participants.filter(p => p.admin !== null).map(p => p.id);
    
    // Verificamos si el remitente es Admin del grupo
    const isAdmins = admins.includes(m.sender);
    
    // Verificamos si es Dueño (usando decodeJid para mayor seguridad)
    const isOwners = [
      botJid,
      ...(settings.owner ? [settings.owner] : []),
      ...global.owner.map(num => num + '@s.whatsapp.net')
    ].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender);
    
    const isBot = m.key.fromMe;

    // Si NO es dueño AND NO es el bot AND NO es admin REAL, bloqueamos
    if (!isOwners && !isBot && !isAdmins) {
      return m.reply('《✧》 Solo el *Dueño*, el *Bot* o *Administradores* pueden usar este comando.');
    }
    // -------------------------------------------------------------------

    const botname = settings.namebot || 'YukiBot';
    const stateArg = args[0]?.toLowerCase();
    const validStates = ['on', 'off', 'enable', 'disable'];
    
    const mapTerms = {
      antilinks: 'antilinks',
      antienlaces: 'antilinks',
      antilink: 'antilinks',
      welcome: 'welcome',
      bienvenida: 'welcome',
      goodbye: 'goodbye',
      despedida: 'goodbye',
      alerts: 'alerts',
      alertas: 'alerts',
      economy: 'economy',      
      economia: 'economy',
      adminonly: 'adminonly',
      onlyadmin: 'adminonly',
      nsfw: 'nsfw',
      rpg: 'gacha',
      gacha: 'gacha'
    };

    const featureNames = {
      antilinks: 'el *AntiEnlace*',
      welcome: 'el mensaje de *Bienvenida*',
      goodbye: 'el mensaje de *Despedida*',
      alerts: 'las *Alertas*',
      economy: 'los comandos de *Economía*',
      gacha: 'los comandos de *Gacha*',
      adminonly: 'el modo *Solo Admin*',
      nsfw: 'los comandos *NSFW*'
    };

    const featureTitles = {
      antilinks: 'AntiEnlace',
      welcome: 'Bienvenida',
      goodbye: 'Despedida',
      alerts: 'Alertas',
      economy: 'Economía',
      gacha: 'Gacha',
      adminonly: 'AdminOnly',
      nsfw: 'NSFW'
    };

    const normalizedKey = mapTerms[command] || command;
    const current = chatData[normalizedKey] === true;
    const estado = current ? '✓ Activado' : '✗ Desactivado';
    const nombreBonito = featureNames[normalizedKey] || `la función *${normalizedKey}*`;
    const titulo = featureTitles[normalizedKey] || normalizedKey;

    if (!stateArg) {
      return client.reply(m.chat, `*✩ ${titulo} (✿❛◡❛)*\n\nꕥ Un administrador puede activar o desactivar ${nombreBonito} utilizando:\n\n● _Habilitar ›_ *${usedPrefix + command} enable*\n● _Deshabilitar ›_ *${usedPrefix + command} disable*\n\n❒ *Estado actual ›* ${estado}`, m);
    }

    if (!validStates.includes(stateArg)) {
      return m.reply(`✎ Estado no válido. Usa *on*, *off*, *enable* o *disable*\n\nEjemplo:\n${usedPrefix}${command} enable`);
    }

    const enabled = ['on', 'enable'].includes(stateArg);
    
    if (chatData[normalizedKey] === enabled) {
      return m.reply(`✎ *${titulo}* ya estaba *${enabled ? 'activado' : 'desactivado'}*.`);
    }

    chatData[normalizedKey] = enabled;
    return m.reply(`✎ Has *${enabled ? 'activado' : 'desactivado'}* ${nombreBonito}.`);
  }
};
