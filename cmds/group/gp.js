import ws from 'ws';
import fs from 'fs';

export default {
  command: ['gp', 'groupinfo'],
  category: 'grupo',
  run: async (client, m, args, usedPrefix, command) => {
    if (!m.isGroup) return m.reply("❌ Este comando solo puede usarse en grupos.");

    const from = m.chat
    const groupMetadata = await client.groupMetadata(from).catch((e) => {})
    if (!groupMetadata) return m.reply("❌ No se pudo obtener la información del grupo.");

    const groupName = groupMetadata.subject;
    const groupBanner = await client.profilePictureUrl(m.chat, 'image').catch(() => 'https://cdn.yuki-wabot.my.id/files/2PVh.jpeg')
    const groupCreator = groupMetadata.owner ? '@' + groupMetadata.owner.split('@')[0] : 'Desconocido';
    const groupAdmins = groupMetadata?.participants.filter(p => (p.admin === 'admin' || p.admin === 'superadmin')) || []
    const totalParticipants = groupMetadata.participants.length;
    const chatId = m.chat;
    const chat = global.db.data.chats[chatId] || {};
    const chatUsers = chat.users || {};
    const botId = client.user.id.split(':')[0] + "@s.whatsapp.net";
    const botSettings = global.db.data.settings[botId] || {}; // Aseguramos que exista
    const botname = botSettings.botname || 'YukiBot';
    const monedas = botSettings.currency || 'Monedas';
    
    let totalCoins = 0;
    let registeredUsersInGroup = 0;
    
    const resolvedUsers = await Promise.all(
      groupMetadata.participants.map(async (participant) => {
        return { ...participant, phoneNumber: participant.phoneNumber, jid: participant.jid };
      })
    );
    
    resolvedUsers.forEach((participant) => {
      const fullId = participant.phoneNumber || participant.jid || participant.id;
      const user = chatUsers[fullId];
      if (user) {
        registeredUsersInGroup++;
        totalCoins += Number(user.coins) || 0;
      }
    });

    let totalCharacters = 0;
    try {
        const charactersFilePath = './core/characters.json'
        if (fs.existsSync(charactersFilePath)) {
            const data = await fs.promises.readFile(charactersFilePath, 'utf-8')
            const structure = JSON.parse(data)
            const allCharacters = Object.values(structure).flatMap(s => Array.isArray(s.characters) ? s.characters : [])
            totalCharacters = allCharacters.length
        }
    } catch (e) {
        console.error("Error leyendo characters.json en gp:", e);
    }
    
    const claimedIDs = Object.entries(global.db.data.chats[m.chat]?.characters || {}).filter(([, c]) => c.user).map(([id]) => id)
    const claimedCount = claimedIDs.length
    const claimRate = totalCharacters > 0 ? ((claimedCount / totalCharacters) * 100).toFixed(2) : '0.00'
    const rawPrimary = typeof chat.primaryBot === 'string' ? chat.primaryBot : '';
    const botprimary = rawPrimary.endsWith('@s.whatsapp.net') ? `@${rawPrimary.split('@')[0]}` : 'Aleatorio';
    
    // --- AQUÍ SE AGREGA LA LECTURA DEL MODO OWNER ---
    const isOwnerModeOn = botSettings.onlyOwnerMode ? '✓ Activado' : '✘ Desactivado';

    const settings = {
      bot: chat.isBanned ? '✘ Desactivado' : '✓ Activado',
      antilinks: chat.antilinks ? '✓ Activado' : '✘ Desactivado',
      welcome: chat.welcome ? '✓ Activado' : '✘ Desactivado',
      goodbye: chat.goodbye ? '✓ Activado' : '✘ Desactivado',
      alerts: chat.alerts ? '✓ Activado' : '✘ Desactivado',
      gacha: chat.gacha ? '✓ Activado' : '✘ Desactivado',
      economy: chat.economy ? '✓ Activado' : '✘ Desactivado',
      nsfw: chat.nsfw ? '✓ Activado' : '✘ Desactivado',
      adminmode: chat.adminonly ? '✓ Activado' : '✘ Desactivado',
      onlyowner: isOwnerModeOn, // <--- Lo agregamos al objeto settings
      botprimary: botprimary
    };

    try {
      let message = `*「✿」Grupo ◢ ${groupName} ◤*\n\n`;
      message += `➪ *Creador ›* ${groupCreator}\n`;
      message += `❖ Bot Principal › *${settings.botprimary}*\n`;
      message += `♤ Admins › *${groupAdmins.length}*\n`;
      message += `❒ Usuarios › *${totalParticipants}*\n`;
      message += `ꕥ Registrados › *${registeredUsersInGroup}*\n`;
      message += `✿ Claims › *${claimedCount} (${claimRate}%)*\n`;
      message += `♡ Personajes › *${totalCharacters}*\n`;
      message += `⛁ Dinero › *${totalCoins.toLocaleString()} ${monedas}*\n\n`;
      message += `➪ *Configuraciones:*\n`;
      message += `✐ ${botname} › *${settings.bot}*\n`;
      message += `✐ AntiLinks › *${settings.antilinks}*\n`;
      message += `✐ Bienvenida › *${settings.welcome}*\n`;
      message += `✐ Despedida › *${settings.goodbye}*\n`;
      message += `✐ Alertas › *${settings.alerts}*\n`;
      message += `✐ Gacha › *${settings.gacha}*\n`;
      message += `✐ Economía › *${settings.economy}*\n`;
      message += `✐ Nsfw › *${settings.nsfw}*\n`;
      message += `✐ ModoAdmin › *${settings.adminmode}*\n`;
      message += `✐ Solo Dueño › *${settings.onlyowner}*`; // <--- Lo mostramos en la lista

      const mentionOw = groupMetadata.owner ? groupMetadata.owner : '';
      const mentions = [rawPrimary, mentionOw].filter(Boolean);
      
      // NOTA: Asegúrate de que 'dev' esté definido en tu entorno o en este archivo.
      // Si te da error de 'dev is not defined', cámbialo por un texto como 'Desarrollador'
      const footerText = typeof dev !== 'undefined' ? dev : 'YukiBot Info'; 

      return await client.sendContextInfoIndex(m.chat, message.trim(), {}, null, false, mentions, { banner: groupBanner, title: groupName, body: footerText, redes: botSettings.link })
    } catch (e) {
      await m.reply(`> An unexpected error occurred while executing command *${usedPrefix + command}*. Please try again or contact support if the issue persists.\n> [Error: *${e.message}*]`)
    }
  }
};
