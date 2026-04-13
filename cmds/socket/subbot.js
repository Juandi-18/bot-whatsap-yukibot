import ws from 'ws';

export default {
  command: ['bots', 'sockets'],
  category: 'socket',
  run: async (client, m) => {
    const mainBotJid = client.decodeJid(client.user.id);
    const activeSubs = (global.conns || []).filter(sock => sock.user && sock.ws?.readyState === 1);

    const mentionedJid = [];
    const subList = [];

    activeSubs.forEach((sock) => {
      const jid = client.decodeJid(sock.user.id);
      mentionedJid.push(jid);
      subList.push(`- [SubBot] › @${jid.split('@')[0]}`);
    });

    let message = `*「✿」Sockets Activos (${activeSubs.length + 1})*\n\n`;
    message += `❖ Principal › @${mainBotJid.split('@')[0]}\n`;
    message += `✿ Subs Online › *${activeSubs.length}*\n\n`;
    if (subList.length) message += subList.join('\n');

    return await client.sendMessage(m.chat, { text: message, mentions: [mainBotJid, ...mentionedJid] }, { quoted: m });
  },
};
