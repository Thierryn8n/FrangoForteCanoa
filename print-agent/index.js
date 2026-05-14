﻿/* eslint-disable no-console */
const fsSync = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const { PrintAgent } = require('./agent-core');

const baseDir = path.dirname(process.execPath);
const cwdDir = process.cwd();
const envCandidates = [
  path.join(baseDir, '.env'),
  path.join(baseDir, '..', '.env'),
  path.join(cwdDir, '.env'),
];

let envLoadedFrom = null;
for (const envPath of envCandidates) {
  if (fsSync.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    envLoadedFrom = envPath;
    break;
  }
}

const logFile = path.join(baseDir, 'print-agent.log');
function log(...args) {
  const message = args.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join(' ');
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(message);
  try {
    fsSync.appendFileSync(logFile, `${line}\n`, 'utf8');
  } catch {}
}

const agent = new PrintAgent({
  supabaseUrl: process.env.SUPABASE_URL || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  printerName: process.env.PRINTER_NAME || '',
  pollMs: Number(process.env.POLL_MS || 5000),
  agentId: process.env.AGENT_ID || 'PRINT-AGENT-01',
});

agent.on('log', (...args) => log(...args));

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  log('ERRO: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorias.');
  log('Procurei .env em:', envCandidates.join(' | '));
  process.exit(1);
}

log(`.env: ${envLoadedFrom || 'nao encontrado'}`);
agent.start().catch((err) => {
  log('Falha fatal:', err.message || String(err));
  process.exit(1);
});
