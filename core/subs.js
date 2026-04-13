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
        browser: Browsers.ubuntu('Chrome'), 
        auth: state,
        version,
        msgRetryCounterCache,
        syncFullHistory: false,
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
        
        // --- LÓGICA DE VINCULACIÓN ---
        if (connection !== 'open' && commandFlags[senderId]?.active) {
            
            // CASO A: CÓDIGO DE 8 DÍGITOS
            if (isCode && phone) {
                try {
                    await new Promise(resolve => setTimeout(resolve, 3500)); // Espera a que el socket estabilice
                    let codeGen = await sock.requestPairingCode(phone);
                    codeGen = codeGen?.match(/.{1,4}/g)?.join("-") || codeGen;

                    const msgCode = await client.sendMessage(chatId, { 
                        text: `「✿」*CÓDIGO DE VINCULACIÓN* ◢\n\n➩ Código para: @${senderId.split('@')[0]}\n➩ Tu código es: *${codeGen}*\n\n> ꕤ Úsalo en 'Vincular con el número de teléfono'. ♡`,
                        mentions: [senderId]
                    }, { quoted: m });

                    delete commandFlags[senderId]; // Evita duplicados

                    setTimeout(async () => {
                        try { await client.sendMessage(chatId, { delete: msgCode.key }); } catch {}
                    }, 60000);
                } catch (err) { console.error("Error Pairing Code:", err); }
            } 
            
            // CASO B: CÓDIGO QR
            else if (qr && !isCode) {
                try {
                    const msgQR = await client.sendMessage(chatId, { 
                        image: await qrcode.toBuffer(qr, { scale: 8 }), 
                        caption: `「✿」*CÓDIGO QR* ◢\n\n➩ Escanea este código para activar tu Sub-Bot.\n➩ Solicitado por: @${senderId.split('@')[0]}\n\n> ꕤ Se borrará en 1 minuto. ♡`,
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
            sock.userId = sock.user?.id?.split(':')[0]
            if (!global.conns.find((c) => c.userId === sock.userId)) global.conns.push(sock)
            console.log(chalk.green(`[ ✿ ] SUB-BOT conectado: ${sock.userId}`))
            if (commandFlags[senderId]) delete commandFlags[senderId];
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode || 0
            if (reason !== DisconnectReason.loggedOut) {
                setTimeout(() => startSubBot(m, client, caption, isCode, phone, chatId, commandFlags, isCommand), 5000)
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

    return sock
}
