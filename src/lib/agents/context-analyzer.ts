// src/lib/agents/context-analyzer.ts

export class ContextAnalyzer {
  async analyze(query: string, conversationContext: Record<string, any>) {
    const analysis = {
      query_type: this.classifyQuery(query),
      agricultural_domain: this.identifyDomain(query),
      urgency_level: this.assessUrgency(query),
      requires_tools: this.identifyRequiredTools(query),
      user_location: conversationContext.user_location || 'Indonesia',
      seasonal_context: this.getSeasonalContext(),
      technical_level: this.assessTechnicalLevel(query)
    };

    console.log("🔍 Context analysis:", analysis);
    return analysis;
  }

  private classifyQuery(query: string): string {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('bagaimana') || queryLower.includes('cara')) {
      return 'how_to';
    } else if (queryLower.includes('kapan') || queryLower.includes('waktu')) {
      return 'timing';
    } else if (queryLower.includes('berapa') || queryLower.includes('hitung')) {
      return 'calculation';
    } else if (queryLower.includes('cek') || queryLower.includes('lihat')) {
      return 'data_request';
    } else {
      return 'general';
    }
  }

  private identifyDomain(query: string): string[] {
    const domains: string[] = [];
    const queryLower = query.toLowerCase();

    if (queryLower.includes('cuaca') || queryLower.includes('hujan')) {
      domains.push('weather');
    }
    if (queryLower.includes('tanam') || queryLower.includes('padi') || queryLower.includes('jagung')) {
      domains.push('crops');
    }
    if (queryLower.includes('hama') || queryLower.includes('penyakit')) {
      domains.push('pest_management');
    }
    if (queryLower.includes('pupuk') || queryLower.includes('nutrisi')) {
      domains.push('soil_nutrition');
    }

    return domains.length > 0 ? domains : ['general'];
  }

  private assessUrgency(query: string): 'low' | 'medium' | 'high' {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('urgent') || queryLower.includes('cepat') || 
        queryLower.includes('segera') || queryLower.includes('darurat')) {
      return 'high';
    } else if (queryLower.includes('besok') || queryLower.includes('hari ini')) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private identifyRequiredTools(query: string): string[] {
    const tools: string[] = [];
    const queryLower = query.toLowerCase();

    if (queryLower.includes('cuaca') || queryLower.includes('hujan')) {
      tools.push('cekCuaca');
    }
    if (queryLower.includes('tanam') || queryLower.includes('jadwal')) {
      tools.push('buatJadwalTanam');
    }
    if (queryLower.includes('hitung') || queryLower.includes('kebutuhan')) {
      tools.push('hitungKebutuhan');
    }

    return tools;
  }

  private getSeasonalContext(): string {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12

    if (month >= 3 && month <= 5) {
      return 'dry_season';
    } else if (month >= 6 && month <= 8) {
      return 'early_wet_season';
    } else if (month >= 9 && month <= 11) {
      return 'wet_season';
    } else {
      return 'late_wet_season';
    }
  }

  private assessTechnicalLevel(query: string): 'basic' | 'intermediate' | 'advanced' {
    const queryLower = query.toLowerCase();
    
    // Advanced technical terms
    const advancedTerms = ['ph', 'nutrisi', 'mikronutrient', 'pemupukan foliar', 'integrated'];
    const intermediateTerms = ['pupuk', 'varietas', 'hama', 'irigasi'];
    
    if (advancedTerms.some(term => queryLower.includes(term))) {
      return 'advanced';
    } else if (intermediateTerms.some(term => queryLower.includes(term))) {
      return 'intermediate';
    } else {
      return 'basic';
    }
  }
}