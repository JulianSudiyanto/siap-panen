// src/app/api/chat/route.ts

import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";

// 🧠 Import agent components
import { AgentToolRegistry } from "@/lib/agents/tool-registry";
import { ConversationMemory } from "@/lib/agents/memory";
import { ContextAnalyzer } from "@/lib/agents/context-analyzer";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let requestBody;
  
  try {
    requestBody = await req.json();
    const { messages, conversationId } = requestBody;

    console.log("🤖 Agentic AI Request:", { 
      messageCount: messages.length, 
      conversationId: conversationId || 'new'
    });

    // 🧠 Initialize agent components
    const toolRegistry = new AgentToolRegistry();
    const memory = new ConversationMemory(conversationId);
    const contextAnalyzer = new ContextAnalyzer();

    // 💾 Load conversation state
    const conversationState = await memory.loadState();
    
    // 📝 Get user query (simple string extraction)
    const userMessages = messages.filter((m: { role: string }) => m.role === 'user');
    const userQuery: string = userMessages[userMessages.length - 1]?.content || '';
    
    console.log("💬 User Query:", userQuery);

    // 🔍 Analyze context
    const contextAnalysis = await contextAnalyzer.analyze(
      userQuery, 
      conversationState?.context || {}
    );
    
    console.log("🔍 Context Analysis:", contextAnalysis);

    // 🎯 Get recommended tools
    const recommendedTools = toolRegistry.recommendTools(userQuery);
    console.log("🔧 Recommended Tools:", recommendedTools);

    // 🚀 Execute tools
    const toolResults: Record<string, unknown> = {};
    
    for (const toolName of recommendedTools) {
      console.log(`⚡ Executing tool: ${toolName}`);
      
      try {
        // Generate parameters based on query
        const parameters = generateToolParameters(toolName, userQuery, contextAnalysis);
        const toolResult = await toolRegistry.executeTool(toolName, parameters);
        
        toolResults[toolName] = toolResult;
        
        // Save tool call to memory
        if (conversationState) {
          await memory.addToolCall({
            toolName: toolName,
            parameters: parameters,
            result: toolResult,
            timestamp: new Date(),
            success: !('error' in toolResult && toolResult.error)
          });
        }
        
      } catch (error) {
        console.error(`❌ Tool ${toolName} failed:`, error);
        toolResults[toolName] = { 
          error: true, 
          message: String(error) 
        };
      }
    }

    // 🎨 Generate intelligent response
    const hasToolResults = Object.keys(toolResults).length > 0;
    let systemPrompt = `Kamu adalah Siap Panen, asisten AI cerdas untuk petani Indonesia yang ramah dan informatif.`;
    
    if (hasToolResults) {
      systemPrompt += `\n\nData hasil tools:\n${JSON.stringify(toolResults, null, 2)}`;
      systemPrompt += `\n\nGunakan data di atas untuk memberikan respons yang akurat dan berguna. Jelaskan dalam bahasa Indonesia yang mudah dipahami.`;
    }

    const finalResponse = await generateText({
      model: google("gemini-2.5-flash"),
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userQuery
        }
      ]
    });

    // 💾 Update conversation state
    if (conversationState) {
      await memory.updateContext({
        last_query: userQuery,
        last_response: finalResponse.text,
        tools_used: Object.keys(toolResults),
        context_domains: contextAnalysis.agricultural_domain,
        query_type: contextAnalysis.query_type
      });
    }

    // 📊 Generate response metadata
    const responseMetadata = {
      conversationId: memory.getConversationId(),
      toolsUsed: Object.keys(toolResults),
      contextDomains: contextAnalysis.agricultural_domain,
      queryType: contextAnalysis.query_type,
      suggestedFollowUps: generateFollowUps(contextAnalysis),
      hasToolData: hasToolResults
    };

    console.log("✅ Response generated:", { 
      length: finalResponse.text.length,
      toolsUsed: responseMetadata.toolsUsed.length,
      hasToolData: hasToolResults
    });

    return NextResponse.json({
      response: finalResponse.text,
      metadata: responseMetadata
    });

  } catch (error) {
    console.error("💥 Agentic AI Error:", error);
    
    // 🛟 Fallback response with proper error handling
    const fallbackResponse = await handleErrorFallback(requestBody);
    
    return NextResponse.json({
      response: fallbackResponse,
      metadata: {
        error: true,
        fallback: true
      }
    });
  }
}

// 🔧 Generate tool parameters based on query
function generateToolParameters(toolName: string, query: string, context: { user_location?: string }) {
  const queryLower = query.toLowerCase();

  switch (toolName) {
    case 'cekCuaca':
      // Extract location or use default
      const locationMatch = queryLower.match(/(bandung|jakarta|surabaya|medan|makassar|bogor|depok|tangerang|bekasi)/i);
      return {
        lokasi: locationMatch?.[0] || context.user_location || 'Bandung'
      };

    case 'buatJadwalTanam':
      // Extract crop type
      const cropMatch = queryLower.match(/(padi|jagung|kedelai|cabai|tomat|bayam|kangkung|sawi)/i);
      return {
        tanaman: cropMatch?.[0] || 'padi',
        tanggal: new Date().toISOString().split('T')[0]
      };

    case 'hitungKebutuhan':
      // Extract numbers from query
      const numberMatches = queryLower.match(/(\d+(?:\.\d+)?)/g);
      const numbers = numberMatches ? numberMatches.map(n => parseFloat(n)) : [];
      
      return {
        luasHa: numbers[0] || 1,
        dosisKgPerHa: numbers[1] || 300,
        airLiterPerHa: numbers[2] || 1000
      };

    default:
      return {};
  }
}

// 💡 Generate follow-up suggestions
function generateFollowUps(contextAnalysis: { agricultural_domain: string[]; query_type: string }) {
  const suggestions: string[] = [];
  
  if (contextAnalysis.agricultural_domain.includes('weather')) {
    suggestions.push("Cek prediksi cuaca minggu depan?");
  }
  if (contextAnalysis.agricultural_domain.includes('crops')) {
    suggestions.push("Mau buat jadwal perawatan tanaman?");
  }
  if (contextAnalysis.query_type === 'calculation') {
    suggestions.push("Butuh hitung kebutuhan lain?");
  }
  
  // Default suggestions
  if (suggestions.length === 0) {
    suggestions.push(
      "Mau tanya tentang cuaca?",
      "Butuh jadwal tanam?",
      "Perlu hitung kebutuhan pupuk?"
    );
  }
  
  return suggestions.slice(0, 3);
}

// 🛟 Error fallback handler
async function handleErrorFallback(requestBody: { messages?: { content?: string }[] }): Promise<string> {
  try {
    if (!requestBody?.messages) {
      return "Halo! Saya Siap Panen, asisten petani Indonesia. Ada yang bisa saya bantu tentang pertanian? 🌱";
    }

    const lastMessage = requestBody.messages[requestBody.messages.length - 1]?.content || 'Halo';
    
    const result = await generateText({
      model: google("gemini-2.5-flash"),
      messages: [
        {
          role: 'system',
          content: `
Kamu adalah **Siap Panen**, asisten AI untuk petani Indonesia. 
Aturan jawabanmu:

1. **Jawab langsung inti pertanyaan** dalam bentuk jadwal, tabel, atau daftar singkat. 
   - Jika user bertanya soal tanam → beri jadwal tanam (bulan, minggu, jam).
   - Jika soal siram/pupuk → beri jadwal detail (pagi/sore, dosis, interval).
2. **Selalu mulai jawaban dengan rekomendasi jadwal**, lalu beri tips singkat maksimal 2–3 poin.
3. **Ringkas & efisien**. Hindari paragraf panjang.
4. Gunakan bahasa Indonesia sederhana. 
   - Jika user pakai bahasa daerah (Jawa, Sunda, Minang, Bugis, dll), balas pakai bahasa daerah tersebut.
5. Gunakan emoji sederhana 🌱🌽💧 untuk memperjelas.

Contoh format jawaban:
🌽 Jadwal Tanam Jagung (Musim Hujan)  
- Waktu ideal: **November – Januari**  
- Tanam pagi (07:00 – 09:00)  
- Jarak tanam: 70 x 20 cm  

💡 Tips: Pastikan drainase baik agar lahan tidak becek.
`
        },
        {
          role: 'user',
          content: lastMessage
        }
      ]
    });
    
    return result.text;
  } catch {
    return "Halo! Saya Siap Panen, asisten petani Indonesia. Maaf, sistem sedang mengalami gangguan. Coba lagi dalam beberapa saat ya! 🌱";
  }
}