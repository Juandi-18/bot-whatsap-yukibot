import { Browsers, makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason, jidDecode } from '@whiskeysockets/baileys';
import qrcode from "qrcode"
import NodeCache from 'node-cache';
import main from '../main.js'
import events from '../cmds/events.js'
import pino from 'pino';
import fs from 'fs';
import chalk from 'chalk';
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
        browser: Browsers.ubuntu('Chrome'), // Ubuntu/Chrome es más estable para códigos
        auth: state,
        version,
        msgRetryCounterCache,
        syncFullHistory: false,
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
        if (connection === 'open') {
            sock.userId = sock.user?.id?.split(':')[0]
            if (!global.conns.find((c) => c.userId === sock.userId)) global.conns.push(sock)
            console.log(chalk.green(`[ ✿ ] SUB-BOT conectado: ${sock.userId}`))
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode || 0
            if (reason !== DisconnectReason.loggedOut) {
                setTimeout(() => startSubBot(m, client, caption, isCode, phone, chatId, commandFlags, isCommand), 5000)
            }
        }

        // --- LÓGICA DE CÓDIGO DE 8 DÍGITOS (isCode = true) ---
        if (qr && isCode && phone && commandFlags[senderId]) {
            try {
                await new Promise(resolve => setTimeout(resolve, 3000));
                let codeGen = await sock.requestPairingCode(phone);
                codeGen = codeGen?.match(/.{1,4}/g)?.join("-") || codeGen;

                const msgCode = await client.reply(chatId, `「✿」*CÓDIGO DE VINCULACIÓN* ◢\n\n➩ Tu código es: *${codeGen}*\n\n> ꕤ Este mensaje se borrará en 1 minuto. ♡`, m);
                
                delete commandFlags[senderId];

                // AUTOBORRADO EN 1 MINUTO (60000 ms)
                setTimeout(async () => {
                    try { await client.sendMessage(chatId, { delete: msgCode.key }); } catch {}
                }, 60000);

            } catch (err) { console.error("Error Code:", err); }
        }

        // --- LÓGICA DE QR (isCode = false) ---
        if (qr && !isCode && commandFlags[senderId]) {
            try {
                const msgQR = await client.sendMessage(chatId, { image: await qrcode.toBuffer(qr, { scale: 8 }), caption }, { quoted: m })
                
                delete commandFlags[senderId]

                // AUTOBORRADO EN 1 MINUTO (60000 ms)
                setTimeout(async () => {
                    try { await client.sendMessage(chatId, { delete: msgQR.key }) } catch {}
                }, 60000)
            } catch (err) { console.error("Error QR:", err); }
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

    return sock
}
