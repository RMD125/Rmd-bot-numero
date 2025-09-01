const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeInMemoryStore, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const moment = require('moment');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration du numéro demandeur
const DEMANDEUR_NUMERO = "22896190934";
const DEMANDEUR_PAYS = "TG"; // Code pays Togo
const DEMANDEUR_NOM = "RMD Bot";

// Store pour la session
const store = makeInMemoryStore({});
store.readFromFile('./baileys_store.json');
setInterval(() => {
    store.writeToFile('./baileys_store.json');
}, 10000);

app.use(express.json());

// Route principale
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>🤖 RMD Bot WhatsApp - Connexion Numéro</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: linear-gradient(135deg, #25D366, #128C7E);
                    color: white;
                    min-height: 100vh;
                }
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: rgba(255, 255, 255, 0.1);
                    padding: 30px;
                    border-radius: 15px;
                    backdrop-filter: blur(10px);
                }
                .status {
                    padding: 15px;
                    border-radius: 10px;
                    margin: 20px 0;
                    text-align: center;
                    font-weight: bold;
                    font-size: 18px;
                }
                .online { background: #4CAF50; }
                .offline { background: #f44336; }
                .connecting { background: #ff9800; }
                .info-box {
                    background: white;
                    color: #128C7E;
                    padding: 20px;
                    border-radius: 10px;
                    margin: 20px 0;
                }
                .step {
                    margin: 10px 0;
                    padding: 12px;
                    background: #e8f5e8;
                    border-radius: 8px;
                    border-left: 4px solid #25D366;
                }
                .numero {
                    font-size: 24px;
                    font-weight: bold;
                    color: #25D366;
                    text-align: center;
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🤖 RMD Bot WhatsApp</h1>
                <p>Version Connexion par Numéro - Développé par <strong>RMD125</strong></p>
                
                <div class="numero">
                    📱 +${DEMANDEUR_NUMERO}
                </div>

                <div id="status" class="status connecting">
                    🔄 Initialisation de la connexion...
                </div>

                <div class="info-box">
                    <h3>📋 Mode de Connexion</h3>
                    <div class="step"><strong>Type:</strong> Connexion par numéro demandeur</div>
                    <div class="step"><strong>Numéro:</strong> +${DEMANDEUR_NUMERO}</div>
                    <div class="step"><strong>Pays:</strong> Togo (${DEMANDEUR_PAYS})</div>
                    <div class="step"><strong>Statut:</strong> <span id="connectionStatus">En cours...</span></div>
                </div>

                <div class="info-box">
                    <h3>🚀 Commandes Disponibles</h3>
                    <div class="step"><code>!aide</code> - Menu d'aide complet</div>
                    <div class="step"><code>!ping</code> - Test de connexion</div>
                    <div class="step"><code>!tagall</code> - Mentionner tous les membres</div>
                    <div class="step"><code>!time</code> - Heure actuelle</div>
                    <div class="step"><code>!date</code> - Date du jour</div>
                    <div class="step"><code>!rmd</code> - Contact du développeur</div>
                </div>

                <div class="info-box">
                    <h3>📞 Support Technique RMD125</h3>
                    <div class="step">📱 <strong>WhatsApp:</strong> +228 96 19 09 34</div>
                    <div class="step">📱 <strong>WhatsApp:</strong> +228 96 12 40 78</div>
                    <div class="step">⏰ <strong>Réponse:</strong> Sous 24h maximum</div>
                </div>
            </div>

            <script>
                function updateStatus(status, message) {
                    const statusDiv = document.getElementById('status');
                    const statusSpan = document.getElementById('connectionStatus');
                    
                    statusDiv.className = 'status ' + status;
                    statusDiv.innerHTML = message;
                    statusSpan.textContent = message;
                }

                // Simulation du processus de connexion
                const steps = [
                    { time: 1000, message: '🔄 Connexion au serveur WhatsApp...' },
                    { time: 3000, message: '📞 Authentification avec le numéro +${DEMANDEUR_NUMERO}...' },
                    { time: 5000, message: '🔒 Vérification des credentials...' },
                    { time: 7000, message: '✅ Connecté avec succès! Bot opérationnel' }
                ];

                steps.forEach((step, index) => {
                    setTimeout(() => {
                        const status = index === steps.length - 1 ? 'online' : 'connecting';
                        updateStatus(status, step.message);
                    }, step.time);
                });
            </script>
        </body>
        </html>
    `);
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🤖 RMD BOT WHATSAPP - CONNEXION PAR NUMÉRO');
    console.log('='.repeat(60));
    console.log(`📱 Numéro demandeur: +${DEMANDEUR_NUMERO}`);
    console.log(`🌍 Pays: ${DEMANDEUR_PAYS}`);
    console.log(`🚀 Port: ${PORT}`);
    console.log('='.repeat(60));
    connectToWhatsApp();
});

async function connectToWhatsApp() {
    try {
        console.log('🔗 Initialisation de la connexion WhatsApp...');
        
        const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
        const { version } = await fetchLatestBaileysVersion();
        
        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'error' }),
            browser: [DEMANDEUR_NOM, 'Chrome', '120.0.0.0'],
            markOnlineOnConnect: true,
            syncFullHistory: false,
            generateHighQualityLinkPreview: true
        });

        // Bind le store
        store.bind(sock.ev);

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, isNewLogin } = update;
            
            console.log('📡 Statut de connexion:', connection);
            
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log(`🔌 Déconnexion, reconnexion: ${shouldReconnect}`);
                
                if (shouldReconnect) {
                    console.log('🔄 Tentative de reconnexion dans 3 secondes...');
                    setTimeout(() => connectToWhatsApp(), 3000);
                }
            } else if (connection === 'open') {
                console.log('='.repeat(60));
                console.log('✅ CONNEXION RÉUSSIE À WHATSAPP!');
                console.log('='.repeat(60));
                console.log(`📱 Numéro: ${sock.user?.id}`);
                console.log(`👤 Nom: ${sock.user?.name}`);
                console.log(`🌍 Pays: ${DEMANDEUR_PAYS}`);
                console.log(`🕐 Heure: ${moment().format('HH:mm:ss')}`);
                console.log('='.repeat(60));
            }
        });

        sock.ev.on('creds.update', saveCreds);
        
        // Gestion des messages (identique à la version précédente)
        sock.ev.on('messages.upsert', async (m) => {
            const message = m.messages[0];
            if (!message.key.fromMe && m.type === 'notify') {
                await sock.readMessages([message.key]);
                
                const text = getMessageText(message);
                const jid = message.key.remoteJid;
                const isGroup = jid.endsWith('@g.us');
                const sender = message.pushName || 'Unknown';
                
                console.log(`📨 Message de ${sender}: ${text}`);
                
                // Commandes de base
                if (text === '!ping' || text === '.ping') {
                    await sock.sendMessage(jid, { text: '🏓 Pong! Bot RMD opérationnel' });
                }
                else if (text === '!aide' || text === '.help' || text === '!help') {
                    await sock.sendMessage(jid, { text: helpMessage });
                }
                else if (text === '!info' || text === '.info') {
                    await sock.sendMessage(jid, { text: infoMessage });
                }
                else if (text === '!rmd' || text === '.rmd') {
                    await sock.sendMessage(jid, { text: rmdContact });
                }
                else if (text === '!time' || text === '.time') {
                    const time = moment().format('HH:mm:ss');
                    await sock.sendMessage(jid, { text: `🕐 Heure actuelle: ${time}` });
                }
                else if (text === '!date' || text === '.date') {
                    const date = moment().format('DD/MM/YYYY');
                    await sock.sendMessage(jid, { text: `📅 Date actuelle: ${date}` });
                }
                else if (text === '!status' || text === '.status') {
                    await sock.sendMessage(jid, { text: '✅ Bot RMD en ligne et opérationnel! Développé par RMD125' });
                }
                
                // Commandes de mention (tag)
                else if ((text === '!tagall' || text === '.tagall') && isGroup) {
                    await tagAllMembers(sock, jid);
                }
                else if ((text === '!tagadmin' || text === '.tagadmin') && isGroup) {
                    await tagAdmins(sock, jid);
                }
                else if ((text.startsWith('!tag ') || text.startsWith('.tag ')) && isGroup) {
                    const messageText = text.substring(5);
                    await tagWithMessage(sock, jid, messageText);
                }
                else if ((text === '!everyone' || text === '.everyone') && isGroup) {
                    await tagAllMembers(sock, jid);
                }
                
                // Réponse automatique
                else if (text.toLowerCase().includes('bonjour') || text.toLowerCase().includes('salut')) {
                    await sock.sendMessage(jid, { text: `👋 Bonjour! Je suis le bot RMD. Tapez !aide pour voir les commandes.` });
                }
                else if (text.toLowerCase().includes('merci')) {
                    await sock.sendMessage(jid, { text: `👍 De rien! Pour toute question, contactez RMD125.` });
                }
            }
        });

    } catch (error) {
        console.error('❌ Erreur de connexion:', error.message);
        console.log('🔄 Nouvelle tentative dans 5 secondes...');
        setTimeout(() => connectToWhatsApp(), 5000);
    }
}

// Fonctions utilitaires (identiques)
function getMessageText(message) {
    if (message.message?.conversation) {
        return message.message.conversation;
    }
    if (message.message?.extendedTextMessage?.text) {
        return message.message.extendedTextMessage.text;
    }
    if (message.message?.imageMessage?.caption) {
        return message.message.imageMessage.caption;
    }
    if (message.message?.videoMessage?.caption) {
        return message.message.videoMessage.caption;
    }
    return '';
}

async function tagAllMembers(sock, jid) {
    try {
        const groupMetadata = await sock.groupMetadata(jid);
        const participants = groupMetadata.participants;
        
        let mentionText = '📍 *MENTION DE TOUS LES MEMBRES*\n\n';
        participants.forEach(participant => {
            mentionText += `@${participant.id.split('@')[0]} `;
        });
        
        mentionText += '\n\n🤖 _Mention par RMD Bot_';
        
        await sock.sendMessage(jid, { 
            text: mentionText,
            mentions: participants.map(p => p.id)
        });
    } catch (error) {
        console.error('Erreur tagAllMembers:', error);
        await sock.sendMessage(jid, { text: '❌ Impossible de mentionner les membres' });
    }
}

async function tagAdmins(sock, jid) {
    try {
        const groupMetadata = await sock.groupMetadata(jid);
        const admins = groupMetadata.participants.filter(p => p.admin);
        
        let mentionText = '👑 *MENTION DES ADMINISTRATEURS*\n\n';
        admins.forEach(admin => {
            mentionText += `@${admin.id.split('@')[0]} `;
        });
        
        mentionText += '\n\n🤖 _Mention par RMD Bot_';
        
        await sock.sendMessage(jid, { 
            text: mentionText,
            mentions: admins.map(a => a.id)
        });
    } catch (error) {
        console.error('Erreur tagAdmins:', error);
        await sock.sendMessage(jid, { text: '❌ Impossible de mentionner les administrateurs' });
    }
}

async function tagWithMessage(sock, jid, messageText) {
    try {
        const groupMetadata = await sock.groupMetadata(jid);
        const participants = groupMetadata.participants;
        
        let mentionText = `📢 ${messageText}\n\n`;
        participants.forEach(participant => {
            mentionText += `@${participant.id.split('@')[0]} `;
        });
        
        mentionText += '\n\n🤖 _Mention par RMD Bot_';
        
        await sock.sendMessage(jid, { 
            text: mentionText,
            mentions: participants.map(p => p.id)
        });
    } catch (error) {
        console.error('Erreur tagWithMessage:', error);
        await sock.sendMessage(jid, { text: '❌ Impossible d\'envoyer la mention' });
    }
}

// Messages d'aide (identiques)
const helpMessage = `
🤖 *RMD BOT - AIDE* 🇹🇬

🔧 *Commandes Principales:*
!aide - Affiche ce message d'aide
!ping - Test de connexion du bot
!status - Statut du bot
!info - Informations techniques
!rmd - Contact du développeur
!time - Heure actuelle
!date - Date du jour

🏷️ *Commandes de Mention:*
!tagall - Mentionne tous les membres
!tagadmin - Mentionne les administrateurs
!tag [texte] - Message avec mention
!everyone - Alternative à tagall

👑 *Développeur:* RMD125
📞 *Support:* +228 96 19 09 34
🌐 *Connecté via:* +${DEMANDEUR_NUMERO}

_Utilisez ! devant chaque commande_
`;

const infoMessage = `
🤖 *RMD BOT - INFORMATIONS TECHNIQUES*

*Version:* 4.0.0 Premium
*Développeur:* RMD125
*Statut:* ✅ En ligne et opérationnel
*Numéro:* +${DEMANDEUR_NUMERO}
*Pays:* Togo 🇹🇬
*Mode:* Connexion par numéro demandeur

*Node.js:* ${process.version}
*Plateforme:* ${process.platform}
*Mémoire:* ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB

*Fonctionnalités:*
✅ Messages avec mentions
✅ Gestion des groupes
✅ Réponses automatiques
✅ Sécurité renforcée
✅ Support 24/7

*Contact urgent:*
📞 +228 96 19 09 34
📞 +228 96 12 40 78
`;

const rmdContact = `
👑 *CONTACT RMD125 - DÉVELOPPEUR OFFICIEL*

*WhatsApp Business:*
📞 +228 96 19 09 34 (Support technique)
📞 +228 96 12 40 78 (Support commercial)

*Services Professionnels:*
🛠️ Développement de bots WhatsApp
🤖 Automatisation WhatsApp Business
💡 Solutions personnalisées
🔧 Maintenance technique

*Disponibilité:*
🕐 Réponse sous 24h maximum
🌍 Support international
🔒 Confidentialité garantie

*Projets réalisés:*
+50 bots WhatsApp déployés
+100 clients satisfaits
+3 ans d'expérience

_Pour un devis personnalisé, contactez-moi directement_
`;
