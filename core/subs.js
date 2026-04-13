import { Browsers, makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason, jidDecode } from '@whiskeysockets/baileys';
import qrcode from "qrcode";
import NodeCache from 'node-cache';
import main from '../main.js';
import pino from 'pino';
import fs from 'fs';
import chalk from 'chalk';
import ws from 'ws';
import { smsg } from './message.js';

if (!global.conns) global.conns = [];
const msgRetryCounterCache = new NodeCache();

export async function startSubBot(m, client, caption = '', isCode = false, phone = '', chatId = '', commandFlags = {}, isCommand = false) {
    const id = phone || (m?.sender || '').split('@')[0];
    const sessionFolder = `./Sessions/Subs/${id}`;
    const senderId = m?.sender;

    const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        browser: Browsers.ubuntu('Chrome'), 
        auth: state,
        version,
        msgRetryCounterCache,
        syncFullHistory: false,
    });

    sock.isPairing = false;
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
        if (connection !== 'open' && commandFlags[senderId]?.active) {
            if (isCode && phone) {
                if (sock.isPairing) return;
                sock.isPairing = true;
                setTimeout(async () => {
                    try {
                        if (!sock.authState.creds.registered && sock.ws.readyState === ws.OPEN) {
                            let codeGen = await sock.requestPairingCode(phone);
                            codeGen = codeGen?.match(/.{1,4}/g)?.join("-") || codeGen;
                            const msgCode = await client.sendMessage(chatId, { text: `${codeGen}` }, { quoted: m });
                            delete commandFlags[senderId];
                            setTimeout(() => { try { client.sendMessage(chatId, { delete: msgCode.key }) } catch {} }, 60000);
                        }
                    } catch (err) { 
                        sock.isPairing = false; 
                    }
                }, 12000);
            } else if (qr && !isCode) {
                const msgQR = await client.sendMessage(chatId, { image: await qrcode.toBuffer(qr, { scale: 8 }), caption: `Escanea para activar.` }, { quoted: m });
                delete commandFlags[senderId];
            }
        }

        if (connection === 'open') {
            const botId = client.decodeJid(sock.user.id);
            if (!global.conns.some(c => client.decodeJid(c.user?.id) === botId)) global.conns.push(sock);
            console.log(chalk.green(`[ ✿ ] SUB-BOT conectado: ${botId}`));
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode || 0;
            const botId = sock.user ? client.decodeJid(sock.user.id) : null;
            if (botId) global.conns = global.conns.filter(c => client.decodeJid(c.user?.id) !== botId);
            if (reason === DisconnectReason.loggedOut) {
                fs.rmSync(sessionFolder, { recursive: true, force: true });
            } else {
                setTimeout(() => startSubBot(m, client, caption, isCode, phone, chatId, commandFlags, isCommand), 10000);
            }
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (let raw of messages) {
            if (!raw.message) continue;
            let msg = await smsg(sock, raw);
            try { main(sock, msg, messages) } catch (err) {}
        }
    });

    return sock;
}
