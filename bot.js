const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const PHONE_NUMBER = "22896190934";

app.use(express.json());

// Route principale
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>🤖 RMD Bot - Connexion WhatsApp</title>
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
        .instructions {
          background: white;
          color: #128C7E;
          padding: 20px;
          border-radius: 10px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 RMD Bot WhatsApp</h1>
        <p>Connexion WhatsApp - Développé par <strong>RMD125</strong></p>
        
        <div class="numero">
          📱 +${PHONE_NUMBER}
        </div>

        <div id="status" class="status connecting">
          🔄 En attente de connexion...
        </div>

        <div class="instructions">
          <h3>📋 Instructions de Connexion</h3>
          <div class="step">
            <strong>1. Ouvrez WhatsApp sur votre téléphone</strong>
          </div>
          <div class="step">
            <strong>2. Allez dans Paramètres → Appareils connectés</strong>
          </div>
          <div class="step">
            <strong>3. Cliquez sur "Connecter un appareil"</strong>
          </div>
          <div class="step">
            <strong>4. Autorisez l'utilisation du numéro +${PHONE_NUMBER}</strong>
          </div>
          <div class="step">
            <strong>5. Entrez le code de vérification qui apparaîtra ci-dessous</strong>
          </div>
        </div>

        <div class="info-box">
          <h3>📞 Support RMD125</h3>
          <div class="step">📱 WhatsApp: +228 96 19 09 34</div>
          <div class="step">📱 WhatsApp: +228 96 12 40 78</div>
          <div class="step">⏰ Réponse sous 24h maximum</div>
        </div>
      </div>

      <script>
        function updateStatus(status, message) {
          const statusDiv = document.getElementById('status');
          statusDiv.className = 'status ' + status;
          statusDiv.innerHTML = message;
        }

        // Connexion SSE pour les mises à jour en temps réel
        const eventSource = new EventSource('/connection-updates');
        
        eventSource.onmessage = function(event) {
          const data = JSON.parse(event.data);
          
          if (data.type === 'code') {
            updateStatus('connecting', `🔢 Code de vérification: ${data.code}`);
          } else if (data.type === 'connected') {
            updateStatus('online', '✅ Connecté avec succès!');
          } else if (data.type === 'disconnected') {
            updateStatus('offline', '❌ Déconnecté - Reconnexion en cours...');
          }
        };
      </script>
    </body>
    </html>
  `);
});

// Route pour les mises à jour de connexion
app.get('/connection-updates', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Garder la connexion ouverte
  req.on('close', () => {
    console.log('Client SSE déconnecté');
  });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🤖 Serveur démarré sur le port ${PORT}`);
  console.log(`📱 Configuration pour le numéro: +${PHONE_NUMBER}`);
  initializeWhatsApp();
});

async function initializeWhatsApp() {
  try {
    console.log('🔗 Initialisation de la connexion WhatsApp...');
    
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      // Configuration pour la connexion par code
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 10000,
      browser: ['RMD Bot', 'Chrome', '120.0.0.0']
    });

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr, isNewLogin, code } = update;
      
      console.log('📡 Statut de connexion:', connection);
      
      if (code) {
        console.log(`📲 Code de vérification reçu: ${code}`);
        // Ici vous devriez envoyer ce code à l'interface utilisateur
        // via SSE ou une autre méthode
      }
      
      if (connection === 'close') {
        const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('🔌 Déconnecté - Reconnexion dans 10 secondes...');
        setTimeout(() => initializeWhatsApp(), 10000);
      } else if (connection === 'open') {
        console.log('✅ Connecté avec succès à WhatsApp!');
      }
    });

    sock.ev.on('creds.update', saveCreds);
    
    // Gestion des messages
    sock.ev.on('messages.upsert', async (m) => {
      const message = m.messages[0];
      if (!message.key.fromMe && m.type === 'notify') {
        await sock.readMessages([message.key]);
        
        const text = getMessageText(message);
        const jid = message.key.remoteJid;
        
        if (text === '!ping') {
          await sock.sendMessage(jid, { text: '🏓 Pong!' });
        }
        else if (text === '!aide') {
          await sock.sendMessage(jid, { text: helpMessage });
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('🔄 Nouvelle tentative dans 10 secondes...');
    setTimeout(() => initializeWhatsApp(), 10000);
  }
}

function getMessageText(message) {
  if (message.message?.conversation) {
    return message.message.conversation;
  }
  if (message.message?.extendedTextMessage?.text) {
    return message.message.extendedTextMessage.text;
  }
  return '';
}

const helpMessage = `
🤖 *RMD BOT - AIDE*

🔧 *Commandes Disponibles:*
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

👑 *Développeur:* RMD125
📞 *Support:* +228 96 19 09 34
`;

// Gestion propre de la fermeture
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du bot...');
  process.exit(0);
});
