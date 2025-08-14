// index.js - VERSÃO FINAL E LIMPA
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const { getCAInfo, loadData } = require('./data.js');

async function connectToWhatsApp() {
  console.log('[BOT] Preparando a base de dados em segundo plano...');
  // Inicia o carregamento dos dados do arquivo CSV
  loadData();

  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log("--- NOVO QR CODE, POR FAVOR ESCANEIE ---");
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Conexão fechada, a reconectar...', shouldReconnect);
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === 'open') {
      console.log('[BOT] Conectado com sucesso ao WhatsApp!');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message) return;
    const textoMensagem = (msg.message.conversation || msg.message.extendedTextMessage?.text)?.trim().toLowerCase();
    if (!textoMensagem) return;

    let resposta = null;
    const matchCA = textoMensagem.match(/^(ca)\s*(\d+)$/);

    if (matchCA) {
      const numeroCA = matchCA[2];
      const dados = getCAInfo(numeroCA); 
      if (dados.error) {
        resposta = dados.error;
      } else {
        resposta = `*✅ Resultado da Consulta do CA: ${dados['Nº do CA']}*\n\n` + `*Data