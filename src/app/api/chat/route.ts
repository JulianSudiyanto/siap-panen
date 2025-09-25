import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    console.log("=== API ROUTE CALLED ===");

    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    const lastUserMessage =
      messages[messages.length - 1]?.content?.toString() || "";
    console.log("Processing message:", lastUserMessage);

    // 🌱 mode agriculture
    const aiResult = await generateText({
      model: google("gemini-2.5-flash"),
      prompt: `Kamu adalah asisten pertanian bernama "Siap Panen". 
Tugasmu membantu petani dalam:
- Menentukan waktu tanam yang tepat sesuai musim/cuaca
- Membuat jadwal penyiraman & pemupukan
- Memberikan tips perawatan tanaman
- Menjelaskan penyakit tanaman dan solusinya
Jawablah ringkas, praktis, dan relevan.

Pertanyaan pengguna: ${lastUserMessage}`,
    });

    const responseText = aiResult.text;

    console.log("✅ Response generated:", responseText.slice(0, 80) + "...");

    return NextResponse.json({
      response: responseText,
    });
  } catch (error) {
    console.error("💥 API ERROR:", error);
    return NextResponse.json(
      {
        error: "Failed to generate response",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
