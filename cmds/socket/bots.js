import chalk from 'chalk';
import ws from 'ws';

export default {
  command: ['bots', 'sockets'],
  category: 'socket',
  run: async (client, m) => {
    const botId = client.user.id.split(':')[0] + '@s.whatsapp.net';
    const botSettings = global.db.data.settings[botId] || {};
    const namebot = botSettings.namebot || 'YukiBot';

    // 1. OBTENER PARTICIPANTES DEL GRUPO (Si es grupo)
    const from = m.chat;
    const groupMetadata = m.isGroup ? await client.groupMetadata(from).catch(() => null) : null;
    const groupParticipants = groupMetadata?.participants.map(p => client.decodeJid(p.id)) || [];

    // 2. FILTRAR BOTS REALMENTE CONECTADOS (Desde global.conns)
    // Filtramos global.conns para asegurar que el socket esté abierto (ws.OPEN)
    const activeSubs = (global.conns || []).filter(sock => 
      sock.user && sock.ws?.readyState === 1 // 1 significa OPEN en WebSocket
    );

    const mainBotJid = client.decodeJid(client.user.id);
    const mentionedJid = [];
    const categorizedBots = { Owner: [], Sub: [] };

    // --- LÓGICA PARA EL BOT PRINCIPAL (OWNER) ---
    const mainBotName = global.db.data.settings[mainBotJid]?.namebot || namebot;
    const mainHandle = `@${mainBotJid.split('@')[0]}`;
    
    // Si estamos en grupo, verificamos si el principal está presente
    if (!m.isGroup || groupParticipants.includes(mainBotJid)) {
      mentionedJid.push(mainBotJid);
      categorizedBots.Owner.push(`- [Owner *${mainBotName}*] › ${mainHandle}`);
    }

    // --- LÓGICA PARA LOS SUBS (SOLO ACTIVOS) ---
    activeSubs.forEach((sock) => {
      const jid = client.decodeJid(sock.user.id);
      const number = jid.split('@')[0];
      
      // Si estamos en grupo, solo mostrar si el SubBot está en este grupo
      if (m.isGroup && !groupParticipants.includes(jid)) return;

      mentionedJid.push(jid);
      const data = global.db.data.settings[jid];
      const name = data?.namebot || 'SubBot';
      categorizedBots.Sub.push(`- [Sub *${name}*] › @${number}`);
    });

    // --- CONSTRUCCIÓN DEL MENSAJE ---
    const totalSubsActivos = activeSubs.length;
    const totalInGroup = categorizedBots.Owner.length + categorizedBots.Sub.length;

    let message = `*「✿」Sockets Conectados (${totalSubsActivos + 1})*\n\n`;
    message += `❖ Principales › *1*\n`;
    message += `✿ Subs Activos › *${totalSubsActivos}*\n\n`;
    message += `➭ *Bots en este chat ›* ${totalInGroup}\n`;
    
    if (categorizedBots.Owner.length) message += categorizedBots.Owner.join('\n') + '\n';
    if (categorizedBots.Sub.length) message += categorizedBots.Sub.join('\n') + '\n';

    if (totalInGroup === 0) message += `_No hay otros sockets en este grupo._`;

    return await client.sendContextInfoIndex(m.chat, message.trim(), {}, m, true, mentionedJid);
  },
};
