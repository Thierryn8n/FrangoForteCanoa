const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const dotenv = require('dotenv');
const { PrintAgent } = require('./agent-core');

const configPath = path.join(app.getPath('userData'), 'print-agent-config.json');
const logPath = path.join(app.getPath('userData'), 'print-agent.log');

function appendLog(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  try {
    fs.appendFileSync(logPath, line, 'utf8');
  } catch {}
}

function readEnvDefaults() {
  const candidates = [
    path.join(process.cwd(), 'print-agent', '.env'),
    path.join(process.cwd(), 'print-agent', '.env.example'),
    path.join(__dirname, '.env'),
    path.join(__dirname, '.env.example'),
    path.join(path.dirname(process.execPath), '.env'),
    path.join(path.dirname(process.execPath), '.env.example'),
    path.join(process.resourcesPath || '', '.env'),
    path.join(process.resourcesPath || '', '.env.example'),
  ].filter(Boolean);

  for (const envPath of candidates) {
    try {
      if (fs.existsSync(envPath)) {
        const parsed = dotenv.parse(fs.readFileSync(envPath, 'utf8'));
        if (parsed.SUPABASE_URL && parsed.SUPABASE_SERVICE_ROLE_KEY) {
          appendLog(`Credenciais carregadas automaticamente de: ${envPath}`);
          return parsed;
        }
      }
    } catch {}
  }
  return {};
}

const envDefaults = readEnvDefaults();

const defaultConfig = {
  supabaseUrl: envDefaults.SUPABASE_URL || 'https://atjpbquidxzcugqojwvo.supabase.co',
  serviceRoleKey: envDefaults.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0anBicXVpZHh6Y3VncW9qd3ZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzkyNDc0NywiZXhwIjoyMDkzNTAwNzQ3fQ.7S6SBBGhlWOcPo6kiqRyIVi8o5fgJlWdsN_Z0OIhoGs',
  anonKey: envDefaults.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0anBicXVpZHh6Y3VncW9qd3ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MjQ3NDcsImV4cCI6MjA5MzUwMDc0N30.F8ymK6MRcFVkOuRSE5Fpkasx8MgGyEpK2ialO8mnnwA',
  jwtSecret: envDefaults.SUPABASE_JWT_SECRET || 'Y+7XgJV0Ds3M+IxTOD1TF3DdyBG8NoJ/qlURGy8THHEr1VY582c7hYiae61Ctbvw+0+fZG4kybgc5u30Y5r58g==',
  printerName: '',
  pollMs: Number(envDefaults.POLL_MS || 5000),
  agentId: envDefaults.AGENT_ID || 'PRINT-AGENT-01',
  autoStart: true,
};

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return { ...defaultConfig, ...JSON.parse(fs.readFileSync(configPath, 'utf8')) };
    }
  } catch {}
  return { ...defaultConfig };
}

function saveConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
}

let mainWindow = null;
let currentConfig = loadConfig();
const agent = new PrintAgent(currentConfig);
const appIconPath = app.isPackaged
  ? path.join(process.resourcesPath, 'build', 'icon.ico')
  : path.join(__dirname, 'build', 'icon.ico');
const appLogoPath = app.isPackaged
  ? path.join(process.resourcesPath, 'build', 'icon.png')
  : path.join(__dirname, 'build', 'icon.png');

function getLogoDataUrl() {
  try {
    if (!fs.existsSync(appLogoPath)) return '';
    const imageBuffer = fs.readFileSync(appLogoPath);
    return `data:image/png;base64,${imageBuffer.toString('base64')}`;
  } catch {
    return '';
  }
}

async function printTestReceipt(printerName) {
  const logoDataUrl = getLogoDataUrl();
  const now = new Date();
  const orderNumber = `PDV-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  const cpfCnpj = '';
  const customerTaxLine = cpfCnpj
    ? `<div><strong>CPF/CNPJ:</strong> ${cpfCnpj}</div>`
    : '';

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <style>
    @page { margin: 0; size: 80mm auto; }
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { 
      font-family: 'Courier New', 'Courier', monospace; 
      font-size: 14px;
      font-weight: 900;
      line-height: 1.3;
      color: #000;
      background: #fff;
      width: 80mm;
      padding: 8px; 
      -webkit-font-smoothing: none;
      -moz-osx-font-smoothing: unset;
      text-rendering: geometricPrecision;
    }
    .center { text-align: center; }
    .logo { width: 54px; height: 54px; object-fit: contain; margin: 0 auto 4px; display:block; }
    .line { border-top: 3px solid #000; margin: 6px 0; }
    .dashed { border-top: 2px dashed #000; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; gap: 8px; }
    .small { font-size: 11px; }
    .bold { font-weight: 900; }
    .item { margin-top: 4px; font-weight: 900; }
    .store-name { font-size: 18px; font-weight: 900; letter-spacing: 1px; }
    .total-row { font-size: 15px; font-weight: 900; border-top: 3px solid #000; padding-top: 4px; margin-top: 4px; }
    @media print { 
      body { margin: 0; padding: 5px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      * { background: #fff !important; color: #000 !important; }
    }
  </style>
</head>
<body>
  ${logoDataUrl ? `<img class="logo" src="${logoDataUrl}" alt="Logo" />` : ''}
  <div class="center bold">FRANGO FORTE PDV</div>
  <div class="center small">COMPROVANTE DE PEDIDO - TESTE</div>
  <div class="line"></div>
  <div class="small"><strong>Pedido:</strong> ${orderNumber}</div>
  <div class="small"><strong>Data:</strong> ${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}</div>
  <div class="small"><strong>Canal:</strong> ONLINE</div>
  <div class="line"></div>
  <div class="small"><strong>Cliente:</strong> Joao da Silva</div>
  ${customerTaxLine}
  <div class="small"><strong>Telefone:</strong> (85) 99730-6525</div>
  <div class="small"><strong>Endereco:</strong> Rua 7 de Abril, 16 - Centro</div>
  <div class="line"></div>
  <div class="small bold">ITENS</div>
  <div class="item small">PEITO DE FRANGO</div>
  <div class="row small"><span>2.500kg x R$ 19,90</span><span>R$ 49,75</span></div>
  <div class="item small">COXA E SOBRECOXA</div>
  <div class="row small"><span>1.200kg x R$ 15,90</span><span>R$ 19,08</span></div>
  <div class="item small">FIGADO DE FRANGO</div>
  <div class="row small"><span>0.800kg x R$ 13,50</span><span>R$ 10,80</span></div>
  <div class="line"></div>
  <div class="row small"><span>Subtotal</span><span>R$ 79,63</span></div>
  <div class="row small"><span>Taxa Entrega</span><span>R$ 5,00</span></div>
  <div class="row bold"><span>TOTAL</span><span>R$ 84,63</span></div>
  <div class="row small"><span>Forma</span><span>PIX</span></div>
  <div class="row small"><span>Status</span><span>PAGO</span></div>
  <div class="line"></div>
  <div class="small center">Documento nao fiscal</div>
  <div class="small center">Obrigado pela preferencia!</div>
</body>
</html>`;

  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

  await new Promise((resolve, reject) => {
    printWindow.webContents.print(
      {
        silent: true,
        printBackground: true,
        deviceName: printerName || undefined,
      },
      (success, errorType) => {
        if (!success) {
          reject(new Error(errorType || 'Falha ao imprimir teste'));
          return;
        }
        resolve(true);
      }
    );
  });

  printWindow.close();
}

agent.on('log', (msg) => {
  appendLog(msg);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('agent:log', msg);
  }
});

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    icon: appIconPath,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Carregar a tela de pedidos por padrão
  await mainWindow.loadFile(path.join(__dirname, 'ui', 'orders-list.html'));
}

// Função para alternar entre telas
ipcMain.handle('switch-screen', async (event, screenName) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  
  const screenPath = path.join(__dirname, 'ui', `${screenName}.html`);
  await mainWindow.loadFile(screenPath);
});

app.whenReady().then(async () => {
  app.setAppUserModelId('com.frangoforte.printagent');
  await createWindow();

  if (currentConfig.autoStart && currentConfig.supabaseUrl && currentConfig.serviceRoleKey) {
    try {
      await agent.start();
    } catch (err) {
      appendLog(`Falha ao iniciar automaticamente: ${err.message || String(err)}`);
    }
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  agent.stop();
});

ipcMain.handle('config:get', async () => currentConfig);

ipcMain.handle('config:save', async (_, config) => {
  currentConfig = {
    ...defaultConfig,
    ...config,
    pollMs: Number(config.pollMs || 5000),
  };
  saveConfig(currentConfig);
  agent.updateConfig(currentConfig);
  return { ok: true };
});

ipcMain.handle('agent:start', async () => {
  if (agent.getStatus().running) return { ok: true };
  agent.updateConfig(currentConfig);
  await agent.start();
  return { ok: true };
});

ipcMain.handle('agent:stop', async () => {
  agent.stop();
  return { ok: true };
});

ipcMain.handle('agent:status', async () => agent.getStatus());

ipcMain.handle('printers:list', async () => {
  const printers = await agent.listPrinters();
  return printers;
});

ipcMain.handle('printer:test', async (_, printerName) => {
  if (printerName !== undefined) {
    currentConfig.printerName = printerName;
    saveConfig(currentConfig);
    agent.updateConfig(currentConfig);
  }
  await printTestReceipt(currentConfig.printerName);
  return { ok: true };
});

ipcMain.handle('logs:read', async () => {
  try {
    if (!fs.existsSync(logPath)) return '';
    return fs.readFileSync(logPath, 'utf8');
  } catch {
    return '';
  }
});

ipcMain.handle('logs:path', async () => logPath);
