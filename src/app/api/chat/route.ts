import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

// === Tools sederhana ===
async function cekCuaca(lokasi: string) {
  console.log("🌦️ Tool cuaca dipanggil untuk:", lokasi);
  // nanti bisa pakai API cuaca beneran
  return `Cuaca di ${lokasi} besok cerah, curah hujan rendah.`;
}

async function buatJadwalTanam(tanaman: string, tanggal: string) {
  console.log("📅 Tool jadwal tanam dipanggil untuk:", tanaman, tanggal);
  return `Jadwal tanam untuk ${tanaman} dimulai pada ${tanggal}, panen sekitar 90 hari kemudian.`;
}

async function hitungKebutuhan(luasHa: number, dosisKgPerHa: number, airLiterPerHa: number) {
  console.log("🌱 Tool pupuk dipanggil untuk luas:", luasHa, "ha");
  const totalPupuk = luasHa * dosisKgPerHa;
  const totalAir = luasHa * airLiterPerHa;
  return `Untuk ${luasHa} ha: butuh ${totalPupuk} kg pupuk & ${totalAir} liter air.`;
}

// === API Route ===
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    const lastUserMessage: string =
      messages[messages.length - 1]?.content?.toString() || "";

    let toolResponse: string | null = null;

    // 🔧 Deteksi trigger untuk tools
    if (lastUserMessage.toLowerCase().includes("cuaca")) {
      toolResponse = await cekCuaca("Desa Contoh");
    } else if (lastUserMessage.toLowerCase().includes("jadwal")) {
      toolResponse = await buatJadwalTanam("padi", "2025-10-01");
    } else if (lastUserMessage.toLowerCase().includes("pupuk")) {
      toolResponse = await hitungKebutuhan(2, 50, 1000);
    }

    // 🚀 Generate jawaban AI
    const result = await generateText({
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

    // ✅ Kirim balik ke frontend
    return NextResponse.json({
      response: result.text,
      toolResponse, // biar bisa dicek di UI
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
