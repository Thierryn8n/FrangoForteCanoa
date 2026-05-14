const el = {
  supabaseUrl: document.getElementById('supabaseUrl'),
  serviceRoleKey: document.getElementById('serviceRoleKey'),
  printerName: document.getElementById('printerName'),
  pollMs: document.getElementById('pollMs'),
  agentId: document.getElementById('agentId'),
  autoStart: document.getElementById('autoStart'),
  saveConfig: document.getElementById('saveConfig'),
  refreshPrinters: document.getElementById('refreshPrinters'),
  testPrint: document.getElementById('testPrint'),
  startAgent: document.getElementById('startAgent'),
  stopAgent: document.getElementById('stopAgent'),
  status: document.getElementById('status'),
  logs: document.getElementById('logs'),
  reloadLogs: document.getElementById('reloadLogs'),
  logPath: document.getElementById('logPath'),
};

function setStatus(running) {
  el.status.textContent = running ? 'RODANDO' : 'PARADO';
  el.status.className = `status ${running ? 'ok' : 'off'}`;
}

function toast(msg) {
  alert(msg);
}

async function loadPrinters(selected) {
  const printers = await window.agentApi.listPrinters();
  el.printerName.innerHTML = '';

  const optionDefault = document.createElement('option');
  optionDefault.value = '';
  optionDefault.textContent = '(padrao do Windows)';
  el.printerName.appendChild(optionDefault);

  for (const printer of printers) {
    const option = document.createElement('option');
    option.value = printer;
    option.textContent = printer;
    el.printerName.appendChild(option);
  }

  el.printerName.value = selected || '';
}

async function loadConfig() {
  const cfg = await window.agentApi.getConfig();
  el.supabaseUrl.value = cfg.supabaseUrl || '';
  el.serviceRoleKey.value = cfg.serviceRoleKey || '';
  el.pollMs.value = String(cfg.pollMs || 5000);
  el.agentId.value = cfg.agentId || 'PRINT-AGENT-01';
  el.autoStart.checked = Boolean(cfg.autoStart);
  await loadPrinters(cfg.printerName || '');
}

async function refreshStatus() {
  const status = await window.agentApi.getStatus();
  setStatus(status.running);
}

async function refreshLogs() {
  const logs = await window.agentApi.readLogs();
  el.logs.value = logs || '';
  el.logs.scrollTop = el.logs.scrollHeight;
}

function getConfigFromForm() {
  return {
    supabaseUrl: el.supabaseUrl.value.trim(),
    serviceRoleKey: el.serviceRoleKey.value.trim(),
    printerName: el.printerName.value,
    pollMs: Number(el.pollMs.value || 5000),
    agentId: el.agentId.value.trim() || 'PRINT-AGENT-01',
    autoStart: el.autoStart.checked,
  };
}

el.saveConfig.addEventListener('click', async () => {
  await window.agentApi.saveConfig(getConfigFromForm());
  toast('Configuração salva.');
});

el.refreshPrinters.addEventListener('click', async () => {
  await loadPrinters(el.printerName.value);
});

el.startAgent.addEventListener('click', async () => {
  await window.agentApi.saveConfig(getConfigFromForm());
  await window.agentApi.startAgent();
  await refreshStatus();
  toast('Agente iniciado.');
});

el.stopAgent.addEventListener('click', async () => {
  await window.agentApi.stopAgent();
  await refreshStatus();
  toast('Agente parado.');
});

el.testPrint.addEventListener('click', async () => {
  await window.agentApi.saveConfig(getConfigFromForm());
  await window.agentApi.testPrinter(el.printerName.value);
  toast('Teste enviado para a impressora.');
});

el.reloadLogs.addEventListener('click', refreshLogs);

window.agentApi.onLog((msg) => {
  el.logs.value += `${new Date().toLocaleString('pt-BR')} ${msg}\n`;
  el.logs.scrollTop = el.logs.scrollHeight;
});

async function init() {
  await loadConfig();
  await refreshStatus();
  await refreshLogs();
  el.logPath.textContent = await window.agentApi.getLogPath();
}

init().catch((err) => {
  toast(err.message || String(err));
});
