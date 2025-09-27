// src/lib/agents/tool-registry.ts

import { 
  cekCuaca, 
  buatJadwalTanam, 
  hitungKebutuhan,

  cekHargaPasar,
  bandingHargaKota,
  hitungKeuntungan,
  prediksiHargaMusim,
  produkHargaTertinggi
} from '@/lib/tools';

export class AgentToolRegistry {
  private tools: Map<string, Function>;
  private toolDescriptions: Map<string, string>;

  constructor() {
    this.tools = new Map();
    this.toolDescriptions = new Map();
    this.registerTools();
  }

  private registerTools() {
    this.tools.set('cekCuaca', cekCuaca);
    this.toolDescriptions.set('cekCuaca', 'Cek kondisi cuaca untuk perencanaan pertanian');

    this.tools.set('buatJadwalTanam', buatJadwalTanam);
    this.toolDescriptions.set('buatJadwalTanam', 'Buat jadwal tanam untuk tanaman tertentu');

    this.tools.set('hitungKebutuhan', hitungKebutuhan);
    this.toolDescriptions.set('hitungKebutuhan', 'Hitung kebutuhan pupuk dan air untuk lahan');

    this.tools.set('cekHargaPasar', cekHargaPasar);
    this.toolDescriptions.set('cekHargaPasar', 'Cek harga pasar terkini untuk produk pertanian');

    this.tools.set('bandingHargaKota', bandingHargaKota);
    this.toolDescriptions.set('bandingHargaKota', 'Bandingkan harga produk di berbagai kota');

    this.tools.set('hitungKeuntungan', hitungKeuntungan);
    this.toolDescriptions.set('hitungKeuntungan', 'Hitung estimasi keuntungan penjualan hasil panen');

    this.tools.set('prediksiHargaMusim', prediksiHargaMusim);
    this.toolDescriptions.set('prediksiHargaMusim', 'Prediksi harga berdasarkan pola musiman');

    this.tools.set('produkHargaTertinggi', produkHargaTertinggi);
    this.toolDescriptions.set('produkHargaTertinggi', 'Lihat produk dengan harga tertinggi di suatu lokasi');
  }

  recommendTools(query: string): string[] {
    const queryLower = query.toLowerCase();
    const recommendedTools: string[] = [];

    if (this.matchesKeywords(queryLower, ['cuaca', 'hujan', 'cerah', 'iklim', 'musim'])) {
      recommendedTools.push('cekCuaca');
    }

    if (this.matchesKeywords(queryLower, ['jadwal tanam', 'kapan tanam', 'waktu tanam', 'musim tanam'])) {
      recommendedTools.push('buatJadwalTanam');
    }

    if (this.matchesKeywords(queryLower, ['hitung', 'butuh berapa', 'kebutuhan', 'pupuk', 'air', 'dosis', 'berapa'])) {
      recommendedTools.push('hitungKebutuhan');
    }

    if (this.matchesKeywords(queryLower, ['harga', 'pasar', 'jual', 'beli', 'harga pasar', 'harga terkini'])) {
      recommendedTools.push('cekHargaPasar');
    }

    if (this.matchesKeywords(queryLower, ['banding', 'bandingkan', 'perbandingan harga', 'harga di', 'lebih mahal', 'lebih murah'])) {
      recommendedTools.push('bandingHargaKota');
    }

    if (this.matchesKeywords(queryLower, ['keuntungan', 'untung', 'rugi', 'laba', 'margin', 'profit'])) {
      recommendedTools.push('hitungKeuntungan');
    }

    if (this.matchesKeywords(queryLower, ['prediksi', 'ramalan', 'trend', 'naik', 'turun', 'bulan depan', 'musim depan'])) {
      recommendedTools.push('prediksiHargaMusim');
    }

    if (this.matchesKeywords(queryLower, ['tertinggi', 'termahal', 'terbaik', 'paling mahal', 'top', 'ranking'])) {
      recommendedTools.push('produkHargaTertinggi');
    }

    if (queryLower.includes('mau jual') || queryLower.includes('siap panen')) {
      if (!recommendedTools.includes('cekHargaPasar')) recommendedTools.push('cekHargaPasar');
      if (!recommendedTools.includes('hitungKeuntungan')) recommendedTools.push('hitungKeuntungan');
    }

    if (queryLower.includes('pilih kota') || queryLower.includes('kemana jual')) {
      if (!recommendedTools.includes('bandingHargaKota')) recommendedTools.push('bandingHargaKota');
    }

    return recommendedTools;
  }

  private matchesKeywords(query: string, keywords: string[]): boolean {
    return keywords.some(keyword => query.includes(keyword));
  }

  async executeTool(toolName: string, parameters: any): Promise<any> {
    const tool = this.tools.get(toolName);
    
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }

    try {
      switch (toolName) {
        case 'cekCuaca':
          return await tool(parameters.lokasi || 'Jakarta');

        case 'buatJadwalTanam':
          return await tool(parameters.tanaman || 'padi', parameters.tanggal || new Date().toISOString().split('T')[0]);

        case 'hitungKebutuhan':
          return await tool(
            parameters.luasHa || 1, 
            parameters.dosisKgPerHa || 300, 
            parameters.airLiterPerHa || 1000
          );

        case 'cekHargaPasar':
          return await tool(parameters.produk || 'padi', parameters.lokasi || 'Jakarta');

        case 'bandingHargaKota':
          return await tool(
            parameters.produk || 'padi', 
            parameters.kota || ['Jakarta', 'Bandung', 'Surabaya', 'Medan']
          );

        case 'hitungKeuntungan':
          return await tool(
            parameters.produk || 'padi',
            parameters.jumlahKg || 100,
            parameters.biayaProduksiPerKg || 2000,
            parameters.lokasi || 'Jakarta'
          );

        case 'prediksiHargaMusim':
          return await tool(
            parameters.produk || 'padi',
            parameters.bulan || new Date().getMonth() + 1
          );

        case 'produkHargaTertinggi':
          return await tool(parameters.lokasi || 'Jakarta', parameters.limit || 5);

        default:
          return await tool(parameters);
      }
    } catch (error) {
      console.error(`Error executing tool ${toolName}:`, error);
      return {
        error: true,
        message: `Gagal menjalankan ${toolName}: ${String(error)}`
      };
    }
  }

  getAllTools(): Array<{ name: string; description: string }> {
    const tools: Array<{ name: string; description: string }> = [];
    
    for (const [name, description] of this.toolDescriptions.entries()) {
      tools.push({ name, description });
    }
    
    return tools;
  }

  getToolDescription(toolName: string): string {
    return this.toolDescriptions.get(toolName) || 'Deskripsi tidak tersedia';
  }

  getUsageStats(): Record<string, number> {
    return {
      total_tools: this.tools.size,
      agriculture_tools: 3,
      market_tools: 5
    };
  }
}