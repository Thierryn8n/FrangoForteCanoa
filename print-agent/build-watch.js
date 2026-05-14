const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Iniciando watch automático para rebuild do print-agent...');

// Função para buildar automaticamente
function buildExe() {
  console.log('🚀 Alteração detectada - rebuildando exe...');
  
  exec('npm run build:exe', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Erro no build:', error);
      return;
    }
    
    console.log('✅ Build concluído com sucesso!');
    console.log('📦 Novo exe gerado em: dist/');
    
    // Instalar automaticamente se houver processo anterior
    exec('taskkill /F /IM "FRANGO PRINT AGENT.exe"', (killError) => {
      if (!killError) {
        console.log('🔄 Processo anterior encerrado');
      }
    });
    
    // Iniciar nova instalação
    setTimeout(() => {
      exec('start "" "dist\\FRANGO PRINT AGENT Setup 1.0.2.exe"', (startError) => {
        if (startError) {
          console.error('❌ Erro ao iniciar instalação:', startError);
        } else {
          console.log('✅ Nova versão instalada com sucesso!');
        }
      });
    }, 2000);
  });
}

// Watch para alterações nos arquivos principais
const filesToWatch = [
  'agent-core.js',
  'index.js',
  'main.js',
  'preload.js',
  'package.json'
];

console.log('👀 Monitorando arquivos:', filesToWatch.join(', '));

// Função simples de watch
function startWatch() {
  let lastModified = {};
  
  // Obter estado inicial
  filesToWatch.forEach(file => {
    try {
      const stats = fs.statSync(file);
      lastModified[file] = stats.mtime.getTime();
    } catch (e) {
      console.log(`⚠️ Erro ao ler ${file}:`, e.message);
    }
  });
  
  // Verificar alterações a cada 2 segundos
  setInterval(() => {
    filesToWatch.forEach(file => {
      try {
        const stats = fs.statSync(file);
        const currentModified = stats.mtime.getTime();
        
        if (currentModified > lastModified[file]) {
          console.log(`🔄 Alteração detectada em: ${file}`);
          lastModified[file] = currentModified;
          buildExe();
        }
      } catch (e) {
        console.log(`⚠️ Erro ao verificar ${file}:`, e.message);
      }
    });
  }, 2000);
}

// Iniciar watch
startWatch();

console.log('🎯 Watch ativo! Qualquer alteração nos arquivos principais irá rebuildar automaticamente.');
console.log('💡 Pressione Ctrl+C para parar.');
