# Print Agent Setup (Electron Desktop App)

## Descrição
O Print Agent é uma aplicação desktop (Electron) que roda na máquina do caixa e gerencia a impressão de recibos em impressora térmica 80mm.

## Fluxo
1. Quando um pedido é criado (PDV ou E-commerce), um `PrintJob` é inserido na tabela `print_jobs`
2. Print Agent conecta via WebSocket e escuta novos jobs
3. Detecta novo job e baixa o HTML do recibo
4. Renderiza a página e envia para a impressora térmica
5. Marca job como `completed` ou `failed`

## Configuração

### 1. Instalar Electron
```bash
npm install electron electron-builder --save-dev
```

### 2. Criar arquivo `electron-main.ts`
```typescript
import { app, BrowserWindow, ipcMain } from 'electron'
import { createClient } from '@supabase/supabase-js'
import * as PrinterModule from 'printer'
import { generateReceiptHTML } from '@/lib/print-agent'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

let mainWindow: BrowserWindow | null = null

// Criar janela invisível para renderizar
function createRenderWindow() {
  const renderWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    show: false
  })
  return renderWindow
}

// Listener para print jobs
async function watchPrintJobs() {
  const subscription = supabase
    .from('print_jobs')
    .on('INSERT', async (payload) => {
      await processPrintJob(payload.new)
    })
    .subscribe()

  return subscription
}

async function processPrintJob(job: any) {
  try {
    // Atualizar status para processing
    await supabase
      .from('print_jobs')
      .update({ status: 'processing' })
      .eq('id', job.id)

    // Buscar configurações da loja
    const { data: settings } = await supabase
      .from('store_settings')
      .select('*')
      .single()

    // Gerar HTML do recibo
    const htmlContent = generateReceiptHTML(job.payload, settings)

    // Renderizar em janela invisível
    const renderWindow = createRenderWindow()
    
    // Esperar carregamento
    await renderWindow.loadURL(`data:text/html,${encodeURIComponent(htmlContent)}`)

    // Imprimir para impressora térmica 80mm
    renderWindow.webContents.print(
      {
        silent: true,
        deviceName: 'thermal-80mm',
        pageSize: {
          height: 1000,
          width: 800
        }
      },
      (success) => {
        if (success) {
          // Marcar como completed
          supabase
            .from('print_jobs')
            .update({ status: 'completed', printed_at: new Date().toISOString() })
            .eq('id', job.id)
            .then(() => renderWindow.destroy())
        } else {
          // Marcar como failed
          supabase
            .from('print_jobs')
            .update({ status: 'failed' })
            .eq('id', job.id)
            .then(() => renderWindow.destroy())
        }
      }
    )
  } catch (error) {
    console.error('Erro ao processar print job:', error)
    await supabase
      .from('print_jobs')
      .update({ status: 'failed' })
      .eq('id', job.id)
  }
}

app.on('ready', () => {
  watchPrintJobs()
})

app.on('quit', () => {
  app.quit()
})
```

### 3. Configurar `package.json`
```json
{
  "main": "electron-main.ts",
  "homepage": "./",
  "scripts": {
    "electron": "electron .",
    "electron-dev": "concurrently \"npm start\" \"wait-on http://localhost:3000 && electron .\"",
    "electron-build": "npm run build && electron-builder"
  },
  "build": {
    "appId": "com.pdv.print-agent",
    "productName": "PDV Print Agent",
    "files": [
      "dist/**/*",
      "electron-main.js",
      "node_modules/**/*"
    ],
    "win": {
      "target": ["nsis", "portable"]
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true
    }
  }
}
```

## Configurar Impressora Térmica 80mm

### Windows
1. Painel de Controle > Dispositivos e Impressoras
2. Adicionar impressora
3. Conectar à impressora térmica (USB)
4. Instalar drivers

### Linux
```bash
sudo apt-get install cups lpadmin
lpstat -p  # Listar impressoras
lpadmin -p thermal-80mm -v usb://device -E  # Configurar
```

### macOS
Impressoras USB geralmente são detectadas automaticamente.

## Configurações de Impressão

### Tamanho do Papel
- Largura: 80mm
- Altura: automática (papel contínuo)

### Margem
- Todas as margens: 0

### DPI
- 203 DPI (padrão para térmicas)

## Teste de Conexão

Na página `/caixa`, existe um botão de teste que envia um print job para validar a conexão:

```typescript
const handleTestPrint = async () => {
  const testJob = await createPrintJob({
    source_channel: 'pos',
    source_order_id: 'test-' + Date.now(),
    status: 'queued',
    payload: { test: true }
  })
}
```

## Troubleshooting

### Impressora não encontrada
- Verificar se impressora está ligada e conectada
- Reinstalar drivers
- Verificar nome da impressora em `Dispositivos e Impressoras`

### Print job fica em "queued"
- Verificar se Print Agent está rodando
- Ver logs do Electron
- Verificar conexão WebSocket

### Recibo saindo mal formatado
- Validar CSS e HTML em `lib/print-agent.ts`
- Testar impressora com arquivo `.txt` simples
- Ajustar DPI e tamanho de papel
