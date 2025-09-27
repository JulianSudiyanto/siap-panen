// src/lib/agents/tool-registry.ts

import { cekCuaca, buatJadwalTanam, hitungKebutuhan } from "@/lib/tools";

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  category: string;
  executionTime?: 'fast' | 'medium' | 'slow';
  reliability?: number;
}

export class AgentToolRegistry {
  private tools: Map<string, AgentTool> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  private registerDefaultTools() {
    // 🌧️ Weather Tools
    this.registerTool({
      name: 'cekCuaca',
      description: 'Cek data cuaca dan curah hujan untuk perencanaan pertanian',
      parameters: {
        lokasi: { type: 'string', description: 'Nama lokasi (kota/daerah)' }
      },
      category: 'weather',
      executionTime: 'medium',
      reliability: 0.9
    });

    // 🌱 Planting Tools
    this.registerTool({
      name: 'buatJadwalTanam',
      description: 'Buat jadwal tanam optimal berdasarkan jenis tanaman dan kondisi',
      parameters: {
        tanaman: { type: 'string', description: 'Jenis tanaman (padi, jagung, dll)' },
        tanggal: { type: 'string', description: 'Tanggal rencana tanam' }
      },
      category: 'planning',
      executionTime: 'fast',
      reliability: 0.95
    });

    // 🧮 Calculation Tools
    this.registerTool({
      name: 'hitungKebutuhan',
      description: 'Hitung kebutuhan pupuk dan air untuk bertani',
      parameters: {
        luasHa: { type: 'number', description: 'Luas lahan dalam hektar' },
        dosisKgPerHa: { type: 'number', description: 'Dosis pupuk per hektar' },
        airLiterPerHa: { type: 'number', description: 'Kebutuhan air per hektar' }
      },
      category: 'calculation',
      executionTime: 'fast',
      reliability: 0.98
    });
  }

  registerTool(tool: AgentTool) {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): AgentTool | undefined {
    return this.tools.get(name);
  }

  getToolDescriptions(): string {
    return Array.from(this.tools.values())
      .map(tool => `${tool.name}: ${tool.description}`)
      .join('\n');
  }

  async executeTool(toolName: string, parameters: Record<string, any>): Promise<any> {
    console.log(`🔧 Executing tool: ${toolName}`, parameters);

    try {
      switch (toolName) {
        case 'cekCuaca':
          const lokasi = parameters.lokasi || 'Bandung';
          const weatherResult = await cekCuaca(lokasi);
          return {
            tool: 'cekCuaca',
            location: lokasi,
            data: weatherResult,
            timestamp: new Date().toISOString()
          };

        case 'buatJadwalTanam':
          const tanaman = parameters.tanaman || 'padi';
          const tanggal = parameters.tanggal || new Date().toISOString();
          const scheduleResult = await buatJadwalTanam(tanaman, tanggal);
          return {
            tool: 'buatJadwalTanam',
            crop: tanaman,
            date: tanggal,
            schedule: scheduleResult,
            timestamp: new Date().toISOString()
          };

        case 'hitungKebutuhan':
          const { luasHa = 1, dosisKgPerHa = 300, airLiterPerHa = 1000 } = parameters;
          const calculationResult = await hitungKebutuhan(luasHa, dosisKgPerHa, airLiterPerHa);
          return {
            tool: 'hitungKebutuhan',
            area: luasHa,
            calculation: calculationResult,
            timestamp: new Date().toISOString()
          };

        default:
          throw new Error(`Tool ${toolName} not implemented`);
      }
    } catch (error) {
      console.error(`❌ Tool ${toolName} failed:`, error);
      return {
        error: true,
        message: `Failed to execute ${toolName}: ${error}`,
        fallback: this.getToolFallback(toolName)
      };
    }
  }

  private getToolFallback(toolName: string): string {
    const fallbacks = {
      cekCuaca: 'Untuk info cuaca terkini, cek BMKG atau aplikasi cuaca lokal.',
      buatJadwalTanam: 'Konsultasi dengan penyuluh pertanian untuk jadwal tanam yang tepat.',
      hitungKebutuhan: 'Gunakan panduan dosis standar dari kemasan pupuk.'
    };
    return fallbacks[toolName as keyof typeof fallbacks] || 'Silakan coba lagi nanti.';
  }

  // Recommend tools berdasarkan query
  recommendTools(query: string): string[] {
    const queryLower = query.toLowerCase();
    const recommended: string[] = [];

    if (queryLower.includes('cuaca') || queryLower.includes('hujan')) {
      recommended.push('cekCuaca');
    }
    if (queryLower.includes('tanam') || queryLower.includes('jadwal')) {
      recommended.push('buatJadwalTanam');
    }
    if (queryLower.includes('hitung') || queryLower.includes('pupuk')) {
      recommended.push('hitungKebutuhan');
    }

    return recommended;
  }
}