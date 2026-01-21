import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { hasCredits, checkAndConsumeCredits } from '@/lib/credits'

// Schéma de réponse forcé pour Gemini (Structured Outputs)
const schema = {
  description: "List of extracted holdings from an investment document",
  type: SchemaType.OBJECT,
  properties: {
    holdings: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING, description: "Full name of the asset" },
          symbol: { type: SchemaType.STRING, description: "Stock ticker/symbol from the document" },
          market_ticker: { type: SchemaType.STRING, description: "The EXACT ticker for Alpha Vantage API (e.g., AAPL, MSFT, QQQ for US; ANX.PAR for Paris; SAP.DEX for Xetra). Search the web if needed." },
          isin: { type: SchemaType.STRING, description: "ISIN code of the asset" },
          quantity: { type: SchemaType.NUMBER, description: "Number of units/shares held" },
          avg_price: { type: SchemaType.NUMBER, description: "Average purchase price per unit (PRU / cost basis / prix de revient)" },
          current_price: { type: SchemaType.NUMBER, description: "Current market price per unit (cours actuel / prix actuel)" },
          current_value: { type: SchemaType.NUMBER, description: "Total current market value (valorisation / valeur actuelle)" },
          currency: { type: SchemaType.STRING, description: "Currency (EUR, USD, etc.)" },
          asset_type: { type: SchemaType.STRING, description: "Type (Stock, ETF, Cash, Bond, Crypto)" },
          sector: { type: SchemaType.STRING, description: "Sector/Industry (Technology, Healthcare, Finance, Energy, Consumer, etc.)" }
        },
        required: ["name", "quantity"]
      }
    },
    debug_info: { type: SchemaType.STRING, description: "Explanation if no holdings are found or issues encountered" }
  },
  required: ["holdings"]
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check credits before making AI call
    const canUseAI = await hasCredits(supabase, user.id)
    if (!canUseAI) {
      return NextResponse.json({ 
        error: 'Monthly credit limit reached. Credits reset on the 1st of each month.',
        credits_exhausted: true
      }, { status: 429 })
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API Key missing' }, { status: 500 });
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to base64 for Gemini multimodal input
    const arrayBuffer = await file.arrayBuffer()
    const base64Data = Buffer.from(arrayBuffer).toString('base64')

    const genAI = new GoogleGenerativeAI(apiKey);
    
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview", 
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
      tools: [{ googleSearch: {} }] as any,
    });

    const prompt = `
      You are a world-class financial data analyst. Extract all CURRENT investment positions from the attached PDF statement.
      
      CRITICAL - UNDERSTAND THE DIFFERENCE BETWEEN THESE FIELDS:
      
      1. **quantity**: Number of units/shares held (Quantité, Nombre de titres)
      
      2. **avg_price**: The PURCHASE price per unit - what the investor PAID
         - French: "PRU", "Prix de Revient Unitaire", "Prix d'achat", "Coût unitaire"
         - English: "Cost basis", "Average cost", "Purchase price"
         - This is NOT the current market price!
      
      3. **current_price**: The CURRENT market price per unit - what it's worth NOW
         - French: "Cours", "Prix actuel", "Dernier cours", "Cotation"
         - English: "Market price", "Current price", "Last price"
      
      4. **current_value**: The TOTAL current market value of the position
         - French: "Valorisation", "Valeur", "Montant", "Valeur de marché"
         - English: "Market value", "Value", "Position value"
         - Usually = quantity × current_price
      
      CRITICAL - FIND THE CORRECT MARKET TICKER:
      
      5. **market_ticker**: You MUST find the correct ticker symbol for Alpha Vantage API.
         - USE WEB SEARCH to find the exact ticker
         - For US stocks/ETFs: just the symbol (AAPL, MSFT, QQQ, SPY)
         - For European stocks on Paris Euronext: add .PAR (e.g., TTE.PAR for TotalEnergies)
         - For European stocks on Xetra: add .DEX (e.g., SAP.DEX)
         - For European stocks on London: add .LON (e.g., HSBA.LON)
         - For ETFs: search for the ETF name + "ticker symbol alpha vantage"
         - Example: "Amundi NASDAQ-100 Daily 2x Leveraged" → search and find the correct ticker
         - If you cannot find a valid ticker, set market_ticker to null
         - For Cash/Money Market positions: set market_ticker to null
      
      INSTRUCTIONS:
      1. Look for sections: "Portefeuille", "Positions", "Holdings", "Avoirs", "Titres"
      2. Extract ALL positions including Cash/Espèces
      3. Be careful to put each value in the CORRECT field
      4. If only current_value is available (not current_price), still extract it
      5. If avg_price is not available, leave it null - DO NOT put current_price in avg_price
      6. For Cash positions: quantity = amount, avg_price = 1, current_price = 1, market_ticker = null
      7. Extract sector when possible: Technology, Healthcare, Finance, Energy, Consumer, Industrials, Materials, Real Estate, Utilities, Communication, etc.
      8. For ETFs with broad exposure, use the primary sector (e.g., "Technology" for QQQ/Nasdaq-100)
      9. ALWAYS search the web to find the correct market_ticker for each holding
      
      RETURN a JSON with "holdings" array. If issues, explain in "debug_info".
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "application/pdf"
        }
      }
    ]);

    // Consume credits based on token usage (PDF parsing uses more tokens)
    const inputTokens = result.response.usageMetadata?.promptTokenCount || 5000
    const outputTokens = result.response.usageMetadata?.candidatesTokenCount || 1000
    await checkAndConsumeCredits(supabase, user.id, inputTokens, outputTokens)

    const textResponse = result.response.text();
    console.log('Gemini raw response:', textResponse);
    
    // Handle potential markdown wrapping
    const cleanJson = textResponse.replace(/```json|```/g, '').trim();
    const response = JSON.parse(cleanJson);

    // Process holdings to ensure we have usable price data
    const processedHoldings = (response.holdings || []).map((h: any) => ({
      ...h,
      // Use market_ticker as the primary symbol for market data lookups
      symbol: h.market_ticker || h.symbol || null,
      // If no current_value but we have quantity and current_price, calculate it
      current_value: h.current_value || (h.quantity && h.current_price ? h.quantity * h.current_price : null)
    }));

    return NextResponse.json({ 
      data: processedHoldings,
      fields: Object.keys(processedHoldings?.[0] || {}),
      debug_info: response.debug_info,
      text: "Multimodal AI extraction successful"
    })

  } catch (error: any) {
    console.error('Gemini Multimodal Error:', error)
    return NextResponse.json({ error: "AI could not process this PDF: " + error.message }, { status: 500 })
  }
}
