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
    const senderId = m?.sender // ID de quien solicita (ej: 519... @s.whatsapp.net)

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
        if (connection === 'open') {
            sock.userId = sock.user?.id?.split(':')[0]
            if (!global.conns.find((c) => c.userId === sock.userId)) global.conns.push(sock)
            console.log(chalk.green(`[ ✿ ] SUB-BOT conectado: ${sock.userId}`))
            
            // Si se conecta con éxito, limpiamos la bandera de este usuario
            if (commandFlags[senderId]) delete commandFlags[senderId];
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode || 0
            if (reason !== DisconnectReason.loggedOut) {
                setTimeout(() => startSubBot(m, client, caption, isCode, phone, chatId, commandFlags, isCommand), 5000)
            }
        }

        // --- LÓGICA DE CÓDIGO DE 8 DÍGITOS ---
        // Verificamos si existe la bandera activa para este SENDER específico
        if (qr && isCode && phone && commandFlags[senderId]?.active) {
            try {
                await new Promise(resolve => setTimeout(resolve, 3000));
                let codeGen = await sock.requestPairingCode(phone);
                codeGen = codeGen?.match(/.{1,4}/g)?.join("-") || codeGen;

                const msgCode = await client.reply(chatId, `「✿」*CÓDIGO DE VINCULACIÓN* ◢\n\n➩ Código para: @${senderId.split('@')[0]}\n➩ Tu código es: *${codeGen}*\n\n> ꕤ Úsalo ahora. Se borrará en 1 minuto. ♡`, m, { mentions: [senderId] });
                
                // IMPORTANTE: Borramos la bandera después de enviar el código para que el bot quede libre para ese usuario
                delete commandFlags[senderId];

                setTimeout(async () => {
                    try { await client.sendMessage(chatId, { delete: msgCode.key }); } catch {}
                }, 60000);

            } catch (err) { 
                console.error("Error al generar Pairing Code:", err);
            }
        }

        // --- LÓGICA DE CÓDIGO QR ---
        if (qr && !isCode && commandFlags[senderId]?.active) {
            try {
                const msgQR = await client.sendMessage(chatId, { 
                    image: await qrcode.toBuffer(qr, { scale: 8 }), 
                    caption: caption + `\n\n> ➩ Solicitado por: @${senderId.split('@')[0]}`,
                    mentions: [senderId]
                }, { quoted: m });
                
                delete commandFlags[senderId];

                setTimeout(async () => {
                    try { await client.sendMessage(chatId, { delete: msgQR.key }) } catch {}
                }, 60000);
            } catch (err) { 
                console.error("Error al generar QR:", err);
            }
        }
    });

    // ... (El resto del código de messages.upsert se mantiene igual)
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
