import { resolveLidToRealJid } from "../../core/utils.js";

export default {
    command: ['dox', 'doxeo', 'doxear'],
    category: 'accion', // Activa el azar automático del main.js
    run: async (client, m, args, usedPrefix, command) => {
        // 1. Identificar a la víctima
        const who2 = m.mentionedJid[0] ? m.mentionedJid[0] : (m.quoted ? m.quoted.sender : m.sender);
        const who = await resolveLidToRealJid(who2, client, m.chat);
        
        if (who === client.user.id.split(':')[0] + '@s.whatsapp.net') {
            return m.reply("《✧》 ¿Intentas doxearme a mí? Mi IP está en la nube, entre algodones y flores. ♡");
        }

        const user = who.split('@')[0];

        // 2. Generador de IPs Aleatorias
        const ipPublica = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        const ipLocal = `192.168.${Math.floor(Math.random() * 2)}.${Math.floor(Math.random() * 255)}`;
        const dns = `1.1.${Math.floor(Math.random() * 9)}.1`;
        const isp = ["Claro Perú", "Movistar", "Entel", "Bitel", "Win"][Math.floor(Math.random() * 5)];
        
        // 3. Animación de hackeo con estilo
        const { key } = await client.sendMessage(m.chat, { 
            text: `﹒⌗﹒🌿 .ৎ˚₊‧  *Iniciando protocolo de búsqueda...* ♡`, 
            mentions: [who] 
        }, { quoted: m });
        
        const pasos = [
            "✿ `[ ▓░░░░░ ] 20%` ➩ Interceptando paquetes de red...",
            "☘️ `[ ▓▓▓░░░ ] 50%` ➩ Extrayendo IP desde el servidor de Trujillo...",
            "✨ `[ ▓▓▓▓▓░ ] 80%` ➩ Entrando al sistema de archivos local...",
            "✅ `[ ▓▓▓▓▓▓ ] 100%` ➩ ¡Doxeo completado con éxito! ꕤ"
        ];

        for (let paso of pasos) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await client.sendMessage(m.chat, { text: paso, edit: key, mentions: [who] });
        }

        // 4. Resultado final con IPs aleatorias
        let doxeoText = `﹒⌗﹒💻 .ৎ˚₊‧  *DATOS ENCONTRADOS* ♡\n\n`;
        doxeoText += `✿ *Objetivo:* @${user}\n`;
        doxeoText += `🌐 *IP Pública:* ${ipPublica}\n`;
        doxeoText += `📍 *IP Local:* ${ipLocal}\n`;
        doxeoText += `📡 *ISP:* ${isp}\n`;
        doxeoText += `🛠️ *DNS:* ${dns}\n`;
        doxeoText += `🔋 *Batería:* ${Math.floor(Math.random() * 100)}%\n`;
        doxeoText += `📂 *Carpeta 'Privada':* 124.8 GB (Mucho anime...) ꕤ\n\n`;
        doxeoText += `> Nota: Estos datos son generados al azar por Yuki Bot. ♡`;

        return client.sendMessage(m.chat, { text: doxeoText, edit: key, mentions: [who] });
    }
}
