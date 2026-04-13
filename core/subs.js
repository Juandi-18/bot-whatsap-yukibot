import { Browsers, makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason, jidDecode } from '@whiskeysockets/baileys';
import qrcode from "qrcode"
import NodeCache from 'node-cache';
import main from '../main.js'
import events from '../cmds/events.js'
import pino from 'pino';
import fs from 'fs';
import chalk from 'chalk';
import ws from 'ws'; // Necesario para verificar el estado del socket
import { smsg } from './message.js';

if (!global.conns) global.conns = []
const msgRetryCounterCache = new NodeCache();

export async function startSubBot(m, client, caption = '', isCode = false, phone = '', chatId = '', commandFlags = {}, isCommand = false) {
    const id = phone || (m?.sender || '').split('@')[0]
    const sessionFolder = `./Sessions/Subs/${id}`
    const senderId = m?.sender

    const { state, saveCreds } = await useMultiFileAuthState(sessionFolder)
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.ubuntu('Chrome'), 
        auth: state,
        version,
        msgRetryCounterCache,
        syncFullHistory: false,
    })

    // Variable interna para evitar peticiones de código dobles
    sock.isPairing = false;

    sock.ev.on('creds.update', saveCreds)

    // Busca esta parte dentro de sock.ev.on('connection.update', ...
if (connection !== 'open' && commandFlags[senderId]?.active) {
    
    if (isCode && phone) {
        if (sock.isPairing) return; 
        sock.isPairing = true;

        console.log(chalk.yellow(`[ ✿ ] Intentando generar código para ${phone}...`));

        try {
            // Bajamos a 8 segundos para no agotar la paciencia del servidor
            await new Promise(resolve => setTimeout(resolve, 8000)); 

            // Verificamos si ya está registrado (si no, pedimos código)
            if (!sock.authState.creds.registered) {
                let codeGen = await sock.requestPairingCode(phone);
                
                if (codeGen) {
                    codeGen = codeGen?.match(/.{1,4}/g)?.join("-") || codeGen;
                    console.log(chalk.magentaBright(`[ ✿ ] Código generado: ${codeGen}`));

                    // ENVIAR EL MENSAJE (Sin filtros extra para asegurar que llegue)
                    await client.sendMessage(chatId, { text: `${codeGen}` }, { quoted: m });
                    
                    // Limpiamos banderas
                    delete commandFlags[senderId];
                } else {
                    console.log(chalk.red("[ ✿ ] WhatsApp no devolvió ningún código."));
                }
            }
        } catch (err) { 
            console.error(chalk.red("[ ✿ ] Error al solicitar el código:"), err.message);
            // Si sale "Connection Closed", avisamos al usuario
            if (err.message.includes('Closed')) {
                client.sendMessage(chatId, { text: "《✧》 WhatsApp cerró la conexión. Intenta de nuevo en 10 segundos. ♡" });
            }
            sock.isPairing = false; 
        }
    }
            
            // CASO B: CÓDIGO QR
            else if (qr && !isCode) {
                try {
                    const msgQR = await client.sendMessage(chatId, { 
                        image: await qrcode.toBuffer(qr, { scale: 8 }), 
                        caption: `「✿」 Escanea este QR para activar tu Sub-Bot.`,
                        mentions: [senderId]
                    }, { quoted: m });

                    delete commandFlags[senderId];

                    setTimeout(async () => {
                        try { await client.sendMessage(chatId, { delete: msgQR.key }) } catch {}
                    }, 60000);
                } catch (err) { console.error("Error QR:", err); }
            }
        }

        if (connection === 'open') {
            const botId = client.decodeJid(sock.user.id);
            sock.userId = botId;

            // Agregamos a la lista global solo si no está ya presente
            if (!global.conns.some(c => client.decodeJid(c.user?.id) === botId)) {
                global.conns.push(sock);
            }

            console.log(chalk.green(`[ ✿ ] SUB-BOT conectado: ${sock.userId}`));
            if (commandFlags[senderId]) delete commandFlags[senderId];
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode || 0;
            const botId = sock.user ? client.decodeJid(sock.user.id) : null;

            // --- LIMPIEZA DE CONEXIÓN HONESTA ---
            // Eliminamos de la lista global de bots activos si se desconecta
            if (botId) {
                global.conns = global.conns.filter(c => client.decodeJid(c.user?.id) !== botId);
            }

            if (reason === DisconnectReason.loggedOut) {
                console.log(chalk.red(`[ ✿ ] SUB-BOT sesión cerrada: ${id}`));
                // Borramos la carpeta de sesión para que no aparezca como "fantasma"
                fs.rmSync(sessionFolder, { recursive: true, force: true });
            } else {
                // Reintento de conexión si no fue un logout manual
                setTimeout(() => startSubBot(m, client, caption, isCode, phone, chatId, commandFlags, isCommand), 10000);
            }
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return
        for (let raw of messages) {
            if (!raw.message) continue
            let msg = await smsg(sock, raw)
            try { main(sock, msg, messages) } catch (err) { console.log(err) }
        }
    })

    // Función para decodificar JID dentro del socket del subbot
    sock.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            const decode = jidDecode(jid) || {};
            return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
        }
        return jid;
    };

    return sock
}
