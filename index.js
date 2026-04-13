import "./settings.js";
import main from './main.js';
import events from './cmds/events.js';
import { Browsers, makeWASocket, makeCacheableSignalKeyStore, useMultiFileAuthState, fetchLatestBaileysVersion, jidDecode, DisconnectReason } from "@whiskeysockets/baileys";
import cfonts from 'cfonts';
import pino from "pino";
import qrcode from "qrcode-terminal";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import readlineSync from "readline-sync";
import os from "os";
import { smsg } from "./core/message.js";
import db from "./core/system/database.js";
import { startSubBot } from './core/subs.js';
import { exec } from "child_process";

const log = {
    info: (msg) => console.log(chalk.bgBlue.white.bold(` INFO `), chalk.white(msg)),
    success: (msg) => console.log(chalk.bgGreen.white.bold(` SUCCESS `), chalk.greenBright(msg)),
    warn: (msg) => console.log(chalk.bgYellowBright.blueBright.bold(` WARNING `), chalk.yellow(msg)),
    warning: (msg) => console.log(chalk.bgYellowBright.red.bold(` WARNING `), chalk.yellow(msg)),
    error: (msg) => console.log(chalk.bgRed.white.bold(` ERROR `), chalk.redBright(msg))
};

const maxCache = 100;
let phoneNumber = global.botNumber || "";
let phoneInput = "";
const methodCodeQR = process.argv.includes("--qr");
const methodCode = process.argv.includes("code");
const DIGITS = (s = "") => String(s).replace(/\D/g, "");

function normalizePhoneForPairing(input) {
    let s = DIGITS(input);
    if (!s) return "";
    if (s.startsWith("0")) s = s.replace(/^0+/, "");
    if (s.length === 10 && s.startsWith("3")) s = "57" + s;
    if (s.startsWith("52") && !s.startsWith("521") && s.length >= 12) s = "521" + s.slice(2);
    if (s.startsWith("54") && !s.startsWith("549") && s.length >= 11) s = "549" + s.slice(2);
    return s;
}

const { say } = cfonts;
console.log(chalk.magentaBright('\n❀ Iniciando...'));
say('Yuki Suou', { align: 'center', gradient: ['red', 'blue'] });

async function loadBots() {
    // Lógica de carga de subbots si existen sesiones
    setTimeout(loadBots, 60 * 1000);
}

function cleanCache() {
    try {
        const tmpFolder = './tmp';
        if (fs.existsSync(tmpFolder)) {
            const files = fs.readdirSync(tmpFolder);
            for (const file of files) {
                try { fs.unlinkSync(path.join(tmpFolder, file)); } catch {}
            }
        }
    } catch (e) {}
}

let opcion;
if (methodCodeQR) {
    opcion = "1";
} else if (methodCode) {
    opcion = "2";
} else if (!fs.existsSync("./Sessions/Owner/creds.json")) {
    opcion = readlineSync.question(chalk.bold.white("\nSeleccione una opción:\n") + chalk.blueBright("1. Con código QR\n") + chalk.cyan("2. Con código de texto de 8 dígitos\n--> "));
    if (opcion === "2") {
        console.log(chalk.bold.redBright(`\nIngrese el número (Ej: 519********)\n---> `));
        phoneInput = readlineSync.question("");
        phoneNumber = normalizePhoneForPairing(phoneInput);
    }
}

let reconexion = 0;
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(global.sessionName);
    const { version } = await fetchLatestBaileysVersion();
    const logger = pino({ level: "silent" });

    const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        browser: Browsers.ubuntu('Chrome'),
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
        markOnlineOnConnect: false,
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        getMessage: async () => "",
    });

    global.client = sock;
    
    // --- LÓGICA DE VINCULACIÓN ---
    if (opcion === "2" && !fs.existsSync("./Sessions/Owner/creds.json")) {
        if (sock.pairingActive) return; 
        sock.pairingActive = true;

        setTimeout(async () => {
            try {
                if (!sock.authState.creds.registered) {
                    const pairing = await sock.requestPairingCode(phoneNumber);
                    const codeBot = pairing?.match(/.{1,4}/g)?.join("-") || pairing;
                    console.log(chalk.black.bgWhite(`\n CÓDIGO DE VINCULACIÓN: ${codeBot} \n`));
                }
            } catch (err) {
                console.log(chalk.red("Error Pairing Code:"), err.message);
                sock.pairingActive = false;
            }
        }, 15000); 
    }

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { qr, connection, lastDisconnect } = update;
        if (qr && (opcion == '1' || methodCodeQR)) {
            qrcode.generate(qr, { small: true });
        }
        if (connection === "open") {
            reconexion = 0;
            log.success(`Conectado a: ${sock.user.name || "YukiBot"}`);
        }
        if (connection === "close") {
            const reason = lastDisconnect?.error?.output?.statusCode || 0;
            if (reason === DisconnectReason.loggedOut) {
                exec("rm -rf ./Sessions/Owner/*");
                process.exit(1);
            } else {
                setTimeout(startBot, 3000);
            }
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        const kay = chatUpdate.messages[0];
        if (!kay?.message || kay.key?.remoteJid === 'status@broadcast') return;
        const m = await smsg(sock, kay);
        main(sock, m, chatUpdate);
    });

    sock.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            const decode = jidDecode(jid) || {};
            return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
        }
        return jid;
    };
}

(async () => {
    global.loadDatabase();
    await startBot();
})();
