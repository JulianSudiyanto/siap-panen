// src/app/api/chat/route.ts

import { google } from "@ai-sdk/google";
import { generateText, convertToModelMessages, ModelMessage } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { tools } from "@/lib/tools-definitions";
import { cekCuaca, buatJadwalTanam, hitungKebutuhan } from "@/lib/tools";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("📩 BODY:", body); // debug isi request

    const { messages } = body;

    // 🔹 validasi messages dulu
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format. Expected an array of messages." },
        { status: 400 }
      );
    }

    // 🔹 convert UIMessage[] ➝ ModelMessage[]
    const modelMessages: ModelMessage[] = convertToModelMessages(messages);

    // 🔹 Step 1: kirim ke AI
    let result = await generateText({
      model: google("gemini-2.5-flash"),
      messages: modelMessages,
      tools,
    });

    // 🔹 Step 2: cek apakah AI panggil tool
    if (result.toolCalls && result.toolCalls.length > 0) {
      const tool = result.toolCalls[0];
      let toolResult: string | null = null;

      if (tool.name === "cekCuaca") {
        toolResult = await cekCuaca(tool.parameters.lokasi);
      } else if (tool.name === "buatJadwalTanam") {
        toolResult = await buatJadwalTanam(
          tool.parameters.tanaman,
          tool.parameters.tanggal
        );
      } else if (tool.name === "hitungKebutuhan") {
        toolResult = await hitungKebutuhan(
          tool.parameters.luasHa,
          tool.parameters.dosisKgPerHa,
          tool.parameters.airLiterPerHa
        );
      }

      // 🔹 Step 3: kasih hasil tool balik ke AI biar dia rangkum
      result = await generateText({
        model: google("gemini-2.5-flash"),
        messages: [
          ...modelMessages,
          { role: "assistant", content: `Tool ${tool.name} berhasil dipanggil.` },
          { role: "tool", content: toolResult ?? "Tool tidak mengembalikan data." },
        ],
      });

      return NextResponse.json({
        response: result.text,
        fromTool: toolResult,
      });
    }

    // 🔹 Kalau ga ada tool
    return NextResponse.json({ response: result.text });
  } catch (err) {
    console.error("💥 API Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
