import { PdvProduct } from '@/lib/types'

interface VoiceCommand {
  quantity: number
  unit: string
  productName: string
}

interface CustomerData {
  name: string
  phone: string
  address?: string
}

interface VoiceOrderData {
  customer: CustomerData
  products: Array<{
    name: string
    quantity: number
    unit: string
  }>
}

export function parseVoiceCommand(transcript: string): VoiceCommand | null {
  try {
    // Normalizar texto
    const text = transcript
      .toLowerCase()
      .trim()
      .replace(/,/g, '.')
      .replace(/meio\s+quilo/gi, '0.5 kg')
      .replace(/meia\s+dúzia/gi, '0.5')
      .replace(/dúzia/gi, '12')

    // Padrões regex para extrair quantidade
    const quantityPattern = /(\d+[.,]\d+|\d+|meio|meia)\s*(kg|quilos?|kilo|kilos?|g|grama|gramas?)/i

    const match = text.match(quantityPattern)
    if (!match) return null

    let quantity = 0
    const quantityStr = match[1].toLowerCase()

    if (quantityStr === 'meio' || quantityStr === 'meia') {
      quantity = 0.5
    } else {
      quantity = parseFloat(quantityStr.replace(',', '.'))
    }

    // Converter para kg
    const unit = match[2].toLowerCase()
    let weightKg = quantity

    if (unit.includes('g') && !unit.includes('kg')) {
      // Se é grama, dividir por 1000
      weightKg = quantity / 1000
    }

    // Extrair nome do produto (restante do texto após quantidade)
    const productName = text
      .replace(quantityPattern, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (!productName) return null

    return {
      quantity: weightKg,
      unit: 'kg',
      productName
    }
  } catch {
    return null
  }
}

export function findClosestProduct(
  searchTerm: string,
  products: PdvProduct[]
): { product: PdvProduct; score: number } | null {
  if (!products.length || !searchTerm) return null

  const normalizeStr = (str: string) =>
    str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '')

  const searchNorm = normalizeStr(searchTerm)
  let bestMatch = null
  let bestScore = 0

  for (const product of products) {
    const productNorm = normalizeStr(product.name)

    // Exact match
    if (productNorm === searchNorm) {
      return { product, score: 1 }
    }

    // Partial matches
    const score = calculateSimilarity(searchNorm, productNorm)

    if (score > bestScore && score >= 0.6) {
      bestScore = score
      bestMatch = product
    }
  }

  return bestMatch ? { product: bestMatch, score: bestScore } : null
}

// Levenshtein distance similarity
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) return 1.0

  const editDistance = getEditDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

function getEditDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }

  return dp[m][n]
}

export function getSimilarProducts(
  searchTerm: string,
  products: PdvProduct[],
  limit = 3
): PdvProduct[] {
  const normalized = searchTerm.toLowerCase().replace(/[^\w\s]/g, '')

  return products
    .map(product => ({
      product,
      score: calculateSimilarity(
        normalized,
        product.name.toLowerCase().replace(/[^\w\s]/g, '')
      )
    }))
    .filter(({ score }) => score >= 0.4)
    .sort(({ score: a }, { score: b }) => b - a)
    .slice(0, limit)
    .map(({ product }) => product)
}

// Nova função para parse completo de pedido com dados do cliente
export function parseVoiceOrder(transcript: string): VoiceOrderData | null {
  try {
    const text = transcript.toLowerCase().trim()
    
    // Extrair nome do cliente
    const namePatterns = [
      /(?:meu nome é|nome é|eu sou|chamo-me)\s+([^,]+?)(?:,|\s+e|\s+meu|\s+quero|$)/i,
      /(?:cliente|para)\s+([^,]+?)(?:,|\s+com|\s+telefone|\s+endereço|\s+quero|$)/i
    ]
    
    let customerName = ''
    for (const pattern of namePatterns) {
      const match = text.match(pattern)
      if (match) {
        customerName = match[1].trim()
        break
      }
    }
    
    // Extrair telefone
    const phonePatterns = [
      /(?:telefone|fone|celular|whatsapp|zap)\s+([0-9\s\-\(\)]{10,20})/i,
      /([0-9]{2}[\s]?[0-9]{4,5}[-\s]?[0-9]{4})/
    ]
    
    let customerPhone = ''
    for (const pattern of phonePatterns) {
      const match = text.match(pattern)
      if (match) {
        customerPhone = match[1].replace(/[^\d]/g, '')
        break
      }
    }
    
    // Extrair endereço (opcional)
    const addressPatterns = [
      /(?:endereço|morada|endereco)\s+([^,]+?)(?:,|\s+quero|\s+gostaria|$)/i,
      /(?:entregar|enviar|para)\s+([^,]+?)(?:,|\s+quero|\s+gostaria|$)/i
    ]
    
    let customerAddress = ''
    for (const pattern of addressPatterns) {
      const match = text.match(pattern)
      if (match) {
        customerAddress = match[1].trim()
        break
      }
    }
    
    // Se não tiver nome ou telefone, tentar extrair do início
    if (!customerName || !customerPhone) {
      const words = text.split(/\s+/)
      const possibleName = words.slice(0, 2).join(' ')
      const possiblePhone = words.find(word => /\d{10,}/.test(word.replace(/[^\d]/g, '')))
      
      if (!customerName) customerName = possibleName
      if (!customerPhone) customerPhone = possiblePhone?.replace(/[^\d]/g, '') || ''
    }
    
    // Extrair produtos
    const productPatterns = [
      /(\d+[.,]\d+|\d+|meio|meia)\s*(kg|quilos?|kilo|kilos?|g|grama|gramas?)\s+(?:de\s+)?([^,\n]+?)(?:,|\s+e|\s+mais|\s+$)/gi
    ]
    
    const products: Array<{name: string; quantity: number; unit: string}> = []
    
    for (const pattern of productPatterns) {
      let match
      while ((match = pattern.exec(text)) !== null) {
        const quantityStr = match[1].toLowerCase()
        let quantity = 0
        
        if (quantityStr === 'meio' || quantityStr === 'meia') {
          quantity = 0.5
        } else {
          quantity = parseFloat(quantityStr.replace(',', '.'))
        }
        
        const unit = match[2].toLowerCase()
        let weightKg = quantity
        
        if (unit.includes('g') && !unit.includes('kg')) {
          weightKg = quantity / 1000
        }
        
        const productName = match[3].trim()
        if (productName) {
          products.push({
            name: productName,
            quantity: weightKg,
            unit: 'kg'
          })
        }
      }
    }
    
    // Validar dados mínimos
    if (!customerName || !customerPhone || products.length === 0) {
      return null
    }
    
    return {
      customer: {
        name: customerName,
        phone: customerPhone,
        address: customerAddress || undefined
      },
      products
    }
  } catch {
    return null
  }
}

// Função para criar produto automaticamente
export async function createProductFromVoice(productName: string): Promise<PdvProduct> {
  const response = await fetch('/api/products/create-from-voice', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: productName,
      source: 'voice_command'
    })
  })
  
  if (!response.ok) {
    throw new Error('Erro ao criar produto')
  }
  
  return response.json()
}

// Função para criar pendência de preço
export async function createPendingPrice(productId: string, productName: string): Promise<void> {
  const response = await fetch('/api/pending-prices/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: productId,
      product_name: productName
    })
  })
  
  if (!response.ok) {
    throw new Error('Erro ao criar pendência de preço')
  }
}
