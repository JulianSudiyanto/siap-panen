import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { tools } from "@/lib/tools-definitions";
import { cekCuaca, buatJadwalTanam, hitungKebutuhan } from "@/lib/tools";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    // Get only the last user message
    const userMessages = messages.filter((m: any) => m.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';
    
    console.log("📩 User query:", lastUserMessage);

    // Simple keyword detection for tools
    let toolResponse = '';
    
    if (lastUserMessage.toLowerCase().includes('cuaca') || 
        lastUserMessage.toLowerCase().includes('hujan')) {
      
      console.log("🌧️ Detected weather query");
      try {
        toolResponse = await cekCuaca('Bandung'); // Default lokasi
        console.log("🌧️ Weather result:", toolResponse);
      } catch (error) {
        console.error("Weather tool error:", error);
        toolResponse = "Maaf, tidak bisa mengambil data cuaca saat ini.";
      }
      
    } else if (lastUserMessage.toLowerCase().includes('tanam') || 
               lastUserMessage.toLowerCase().includes('jadwal')) {
      
      console.log("🌱 Detected planting query");
      try {
        toolResponse = await buatJadwalTanam('padi', new Date().toISOString());
        console.log("🌱 Planting result:", toolResponse);
      } catch (error) {
        console.error("Planting tool error:", error);
        toolResponse = "Maaf, tidak bisa membuat jadwal tanam saat ini.";
      }
    }

    // Create simple prompt for AI
    let prompt = lastUserMessage;
    if (toolResponse) {
      prompt = `User bertanya: "${lastUserMessage}"

Data yang berhasil diambil: ${toolResponse}

Berikan respons yang informatif dan ramah dalam bahasa Indonesia berdasarkan data tersebut.`;
    }

    // Single call to AI
    const result = await generateText({
      model: google("gemini-2.5-flash"),
      messages: [
        {
          role: 'system',
          content: 'Kamu adalah Siap Panen, asisten AI untuk petani Indonesia. Berikan jawaban yang ramah, informatif, dan praktis.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
    });

    console.log("✅ AI response:", result.text);

    return NextResponse.json({
      response: result.text
    });

  } catch (error) {
    console.error("💥 Error:", error);
    return NextResponse.json(
      { 
        response: "Maaf, terjadi kesalahan. Coba lagi ya! 😅",
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 200 } // Return 200 to avoid frontend error handling
    );
  }
}