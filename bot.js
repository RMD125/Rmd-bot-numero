const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, useSingleFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration du numéro
const PHONE_NUMBER = "22896190934";
const COUNTRY_CODE = "228"; // Code pays Togo

app.use(express.json());

// Route principale avec interface de connexion
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>🤖 RMD Bot - Connexion Mobile</title>
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
        .otp-form {
          background: white;
          padding: 20px;
          border-radius: 10px;
          margin: 20px 0;
        }
        .otp-input {
          padding: 10px;
          font-size: 18px;
          width: 100%;
          margin: 10px 0;
          border: 2px solid #25D366;
          border-radius: 5px;
          text-align: center;
        }
        .otp-btn {
          background: #25D366;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          width: 100%;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 RMD Bot WhatsApp</h1>
        <p>Connexion avec code mobile - Développé par <strong>RMD125</strong></p>
        
        <div class="numero">
          📱 +${PHONE_NUMBER}
        </div>

        <div id="status" class="status connecting">
          🔄 En attente de connexion...
        </div>

        <div class="info-box">
          <h3>📱 Connexion par Code Mobile</h3>
          <div class="step">
            <strong>Étape 1:</strong> Un code de vérification sera envoyé au numéro +${PHONE_NUMBER}
          </div>
          <div class="step">
            <strong>Étape 2:</strong> Entrez le code reçu par SMS ci-dessous
          </div>
          <div class="step">
            <strong>Étape 3:</strong> Le bot se connectera automatiquement
          </div>
        </div>

        <div class="otp-form">
          <h3>🔢 Entrez le Code de Vérification</h3>
          <input type="text" id="otpCode" class="otp-input" placeholder="Code à 6 chiffres" maxlength="6">
          <button onclick="submitOTP()" class="otp-btn">✅ Soumettre le Code</button>
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

        function submitOTP() {
          const otpCode = document.getElementById('otpCode').value;
          if (otpCode.length !== 6) {
            alert('Veuillez entrer un code à 6 chiffres');
            return;
          }
          
          updateStatus('connecting', '🔐 Vérification du code...');
          
          fetch('/verify-otp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code: otpCode })
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              updateStatus('online', '✅ Connecté avec succès!');
            } else {
              updateStatus('offline', '❌ Code incorrect. Réessayez.');
            }
          })
          .catch(error => {
            updateStatus('offline', '❌ Erreur de connexion.');
          });
        }

        // Vérifier automatiquement l'état de connexion
        setInterval(() => {
          fetch('/connection-status')
            .then(response => response.json())
            .then(data => {
              if (data.connected) {
                updateStatus('online', '✅ Connecté avec succès!');
              }
            });
        }, 5000);
      </script>
    </body>
    </html>
  `);
});

// Routes pour la gestion OTP
app.post('/verify-otp', (req, res) => {
  const { code } = req.body;
  // Ici, vous devrez implémenter la logique de vérification OTP
  // Pour l'instant, nous simulons une vérification réussie
  console.log(`Code OTP reçu: ${code}`);
  
  // En production, vous enverriez ce code à Baileys pour compléter la connexion
  res.json({ success: true, message: 'Code vérifié avec succès' });
});

app.get('/connection-status', (req, res) => {
  res.json({ connected: false }); // À adapter avec le vrai état de connexion
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
      mobile: true, // Indique que c'est une connexion mobile
    });

    // Pour la connexion par code mobile, nous devons demander le code
    // Note: Cette fonctionnalité peut nécessiter une version spécifique de Baileys
    // ou une implémentation personnalisée

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr, isNewLogin, code } = update;
      
      if (code) {
        console.log(`📲 Code de vérification demandé pour le numéro +${PHONE_NUMBER}`);
        console.log(`🔢 Code: ${code}`);
        // Ici, vous devriez envoyer ce code à l'interface utilisateur
        // ou le stocker pour que l'utilisateur puisse le saisir
      }
      
      if (connection === 'close') {
        const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('🔌 Déconnecté - Reconnexion dans 3 secondes...');
        setTimeout(() => initializeWhatsApp(), 3000);
      } else if (connection === 'open') {
        console.log('✅ Connecté avec succès à WhatsApp!');
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
        
        if (text === '!ping') {
          await sock.sendMessage(jid, { text: '🏓 Pong!' });
        }
        else if (text === '!aide') {
          await sock.sendMessage(jid, { text: '🤖 Commandes: !ping, !aide' });
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('🔄 Nouvelle tentative dans 5 secondes...');
    setTimeout(() => initializeWhatsApp(), 5000);
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

// Gestion propre de la fermeture
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du bot...');
  process.exit(0);
});
