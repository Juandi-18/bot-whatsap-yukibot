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

    // Crear carpeta si no existe
    if (!fs.existsSync(sessionFolder)) {
        fs.mkdirSync(sessionFolder, { recursive: true });
    }

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

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // --- LÓGICA PARA GENERAR VINCULACIÓN ---
        // --- LÓGICA PARA GENERAR VINCULACIÓN (ACTUALIZADA) ---
        if (connection !== 'open' && commandFlags[senderId]?.active) {
            
            // CASO A: CÓDIGO DE 8 DÍGITOS (Optimizado para Android)
            if (isCode && phone) {
                if (sock.isPairing) return;
                sock.isPairing = true;

                await new Promise(resolve => setTimeout(resolve, 8000)); 

                try {
                    console.log(chalk.yellow(`[ ! ] Solicitando código para: ${phone}`));
                    
                    let codeGen = await sock.requestPairingCode(phone).catch(() => null);

                    if (!codeGen) {
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        codeGen = await sock.requestPairingCode(phone).catch(() => null);
                    }

                    if (codeGen) {
                        const finalCode = codeGen?.match(/.{1,4}/g)?.join("-") || codeGen;
                        
                        // Enviamos solo lo necesario para copiar fácil
                        const sentCode = await client.sendMessage(chatId, { 
                            text: `\`\`\`${finalCode}\`\`\`\n\n> Número: ${phone}` 
                        }, { quoted: m });

                        delete commandFlags[senderId]; 

                        // Auto-eliminar después de 1 minuto (60000 ms)
                        setTimeout(async () => {
                            await client.sendMessage(chatId, { delete: sentCode.key }).catch(e => console.log("Error al borrar código:", e));
                        }, 60000);

                    } else {
                        await client.sendMessage(chatId, { text: "⚠️ Error al obtener el código. Reintenta." });
                        sock.isPairing = false;
                        delete commandFlags[senderId];
                    }
                } catch (err) {
                    console.error("Error en proceso de código:", err);
                    sock.isPairing = false;
                }

            // CASO B: CÓDIGO QR (Con auto-borrado)
            } else if (qr && !isCode) {
                try {
                    const sentQR = await client.sendMessage(chatId, { 
                        image: await qrcode.toBuffer(qr, { scale: 8 }), 
                        caption: `*ESCANEAME* (Se borra en 1 min)` 
                    }, { quoted: m });
                    
                    delete commandFlags[senderId];

                    // Auto-eliminar después de 1 minuto
                    setTimeout(async () => {
                        await client.sendMessage(chatId, { delete: sentQR.key }).catch(e => console.log("Error al borrar QR:", e));
                    }, 60000);

                } catch (e) {
                    console.error("Error enviando QR:", e);
                }
            }
        }

        // --- ESTADO DE LA CONEXIÓN ---
        if (connection === 'open') {
            const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            console.log(chalk.bgGreen.black(`[ SUCCESS ] SUB-BOT CONECTADO: ${botId}`));
            
            if (!global.conns.some(c => c.user?.id === sock.user.id)) {
                global.conns.push(sock);
            }
            
            await client.sendMessage(chatId, { text: `✅ *¡Sub-Bot activado correctamente!*\n\nID: @${botId.split('@')[0]}`, mentions: [botId] });
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode || 0;
            console.log(chalk.red(`[ ! ] Conexión cerrada. Razón: ${reason}`));

            if (reason === DisconnectReason.loggedOut) {
                console.log(chalk.bgRed.white(" Sesión cerrada por el usuario. Eliminando archivos... "));
                fs.rmSync(sessionFolder, { recursive: true, force: true });
            } else {
                // Reconexión automática para errores temporales
                setTimeout(() => startSubBot(m, client, caption, isCode, phone, chatId, commandFlags, isCommand), 10000);
            }
        }
    });

    // --- PROCESAMIENTO DE MENSAJES DEL SUB-BOT ---
    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (let raw of messages) {
            if (!raw.message || raw.key.remoteJid === 'status@broadcast') continue;
            try {
                const msg = await smsg(sock, raw);
                await main(sock, msg, messages);
            } catch (err) {
                console.error("Error procesando mensaje en Sub-Bot:", err);
            }
        }
    });

    return sock;
}
