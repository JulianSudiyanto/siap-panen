// src/lib/agents/context-analyzer.ts

export interface ContextAnalysis {
  agricultural_domain: string[];
  query_type: string;
  confidence: number;
  user_location?: string;
  detected_products?: string[];
  detected_cities?: string[];
  intent: string;
  urgency: 'low' | 'medium' | 'high';
}

export class ContextAnalyzer {
  private readonly AGRICULTURAL_DOMAINS = {
    weather: ['cuaca', 'hujan', 'cerah', 'iklim', 'musim', 'kemarau'],
    crops: ['tanaman', 'padi', 'jagung', 'kedelai', 'cabai', 'tomat', 'tanam', 'panen', 'benih'],
    soil: ['tanah', 'ph', 'pupuk', 'kompos', 'nutrisi', 'subur'],
    pests: ['hama', 'penyakit', 'ulat', 'wereng', 'virus', 'jamur'],
    irrigation: ['air', 'siram', 'irigasi', 'pompa', 'drainase'],
    // 🏪 NEW: Market domains
    market: ['harga', 'pasar', 'jual', 'beli', 'ekspor', 'impor'],
    pricing: ['mahal', 'murah', 'naik', 'turun', 'stabil', 'fluktuasi'],
    economics: ['keuntungan', 'laba', 'rugi', 'modal', 'investasi', 'biaya'],
    trading: ['pedagang', 'tengkulak', 'distributor', 'konsumen', 'retail']
  };

  private readonly QUERY_TYPES = {
    information: ['apa', 'bagaimana', 'mengapa', 'kapan', 'dimana', 'siapa'],
    calculation: ['hitung', 'berapa', 'kalkulasi', 'estimasi', 'total'],
    recommendation: ['rekomendasI', 'saran', 'sebaiknya', 'pilih', 'mana yang baik'],
    comparison: ['banding', 'vs', 'lebih baik', 'perbedaan', 'mana yang'],
    prediction: ['prediksi', 'ramalan', 'akan', 'masa depan', 'trend'],
    // 🏪 NEW: Market-specific query types
    price_inquiry: ['harga berapa', 'harga saat ini', 'harga terkini', 'harga sekarang'],
    market_analysis: ['analisis pasar', 'kondisi pasar', 'situasi pasar'],
    profit_analysis: ['untung berapa', 'keuntungan', 'margin', 'profit']
  };

  private readonly PRODUCTS = [
    'padi', 'beras', 'jagung', 'kedelai', 'cabai', 'tomat', 'bawang merah', 
    'bawang putih', 'kentang', 'wortel', 'bayam', 'kangkung', 'sawi'
  ];

  private readonly CITIES = [
    'jakarta', 'bandung', 'surabaya', 'medan', 'makassar', 'yogyakarta',
    'semarang', 'palembang', 'denpasar', 'balikpapan', 'pekanbaru', 'bogor'
  ];

  async analyze(query: string, conversationContext: Record<string, any>): Promise<ContextAnalysis> {
    const queryLower = query.toLowerCase();
    
    // 🎯 Detect agricultural domains
    const detectedDomains: string[] = [];
    for (const [domain, keywords] of Object.entries(this.AGRICULTURAL_DOMAINS)) {
      if (keywords.some(keyword => queryLower.includes(keyword))) {
        detectedDomains.push(domain);
      }
    }

    // 🔍 Detect query type
    let queryType = 'general';
    let maxMatches = 0;
    
    for (const [type, keywords] of Object.entries(this.QUERY_TYPES)) {
      const matches = keywords.filter(keyword => queryLower.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        queryType = type;
      }
    }

    // 📍 Detect products mentioned
    const detectedProducts = this.PRODUCTS.filter(product => 
      queryLower.includes(product) || queryLower.includes(product.replace(' ', '_'))
    );

    // 🏙️ Detect cities mentioned
    const detectedCities = this.CITIES.filter(city => queryLower.includes(city));

    // 🎯 Determine primary intent
    const intent = this.determineIntent(queryLower, detectedDomains, queryType);

    // ⚡ Determine urgency level
    const urgency = this.determineUrgency(queryLower);

    // 📊 Calculate confidence score
    const confidence = this.calculateConfidence(detectedDomains, queryType, detectedProducts);

    return {
      agricultural_domain: detectedDomains,
      query_type: queryType,
      confidence: confidence,
      user_location: conversationContext.user_location || this.extractLocation(queryLower),
      detected_products: detectedProducts,
      detected_cities: detectedCities,
      intent: intent,
      urgency: urgency
    };
  }

  private determineIntent(query: string, domains: string[], queryType: string): string {
    // 🏪 Market-focused intents
    if (domains.includes('market') || domains.includes('pricing')) {
      if (query.includes('jual') || query.includes('panen')) {
        return 'sell_planning';
      }
      if (query.includes('beli') || query.includes('benih') || query.includes('pupuk')) {
        return 'buy_planning';
      }
      if (query.includes('harga')) {
        return 'price_inquiry';
      }
      return 'market_research';
    }

    // 💰 Economics-focused intents
    if (domains.includes('economics')) {
      return 'profit_analysis';
    }

    // 🌾 Traditional agriculture intents
    if (domains.includes('crops') && queryType === 'recommendation') {
      return 'crop_planning';
    }
    
    if (domains.includes('weather')) {
      return 'weather_planning';
    }
    
    if (queryType === 'calculation') {
      return 'resource_calculation';
    }

    return 'general_inquiry';
  }

  private determineUrgency(query: string): 'low' | 'medium' | 'high' {
    const urgentKeywords = ['segera', 'cepat', 'darurat', 'mendesak', 'urgent'];
    const mediumKeywords = ['besok', 'minggu ini', 'bulan ini', 'secepatnya'];
    
    if (urgentKeywords.some(keyword => query.includes(keyword))) {
      return 'high';
    }
    
    if (mediumKeywords.some(keyword => query.includes(keyword))) {
      return 'medium';
    }
    
    // 🏪 Market urgency indicators
    if (query.includes('harga turun') || query.includes('harga naik drastis')) {
      return 'high';
    }
    
    if (query.includes('siap panen') || query.includes('mau jual')) {
      return 'medium';
    }
    
    return 'low';
  }

  private calculateConfidence(domains: string[], queryType: string, products: string[]): number {
    let confidence = 0.3; // Base confidence
    
    // Boost confidence based on domain matches
    confidence += domains.length * 0.15;
    
    // Boost confidence if query type is identified
    if (queryType !== 'general') {
      confidence += 0.2;
    }
    
    // Boost confidence if specific products are mentioned
    confidence += products.length * 0.1;
    
    // Cap at 1.0
    return Math.min(confidence, 1.0);
  }

  private extractLocation(query: string): string | undefined {
    const locationMatch = query.match(/(bandung|jakarta|surabaya|medan|makassar|yogyakarta|semarang)/i);
    return locationMatch ? locationMatch[0] : undefined;
  }

  // 📈 Advanced market context analysis
  async analyzeMarketContext(query: string, historicalData?: any[]): Promise<{
    market_sentiment: 'bullish' | 'bearish' | 'neutral';
    seasonal_factor: number;
    price_volatility: 'low' | 'medium' | 'high';
    recommendations: string[];
  }> {
    const queryLower = query.toLowerCase();
    
    // Simple sentiment analysis
    let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (queryLower.includes('naik') || queryLower.includes('mahal') || queryLower.includes('tinggi')) {
      sentiment = 'bullish';
    } else if (queryLower.includes('turun') || queryLower.includes('murah') || queryLower.includes('rendah')) {
      sentiment = 'bearish';
    }

    // Seasonal analysis based on current month
    const currentMonth = new Date().getMonth() + 1;
    const seasonalFactor = this.calculateSeasonalFactor(currentMonth);

    // Volatility assessment (simplified)
    const volatility = this.assessVolatility(queryLower);

    // Generate recommendations
    const recommendations = this.generateMarketRecommendations(sentiment, seasonalFactor, volatility);

    return {
      market_sentiment: sentiment,
      seasonal_factor: seasonalFactor,
      price_volatility: volatility,
      recommendations: recommendations
    };
  }

  private calculateSeasonalFactor(month: number): number {
    // Indonesian agricultural seasons
    // Dry season: Apr-Sep (0.8-1.2), Wet season: Oct-Mar (0.6-1.0)
    const seasonalMap: Record<number, number> = {
      1: 0.7,  // January - wet season, lower prices
      2: 0.6,  // February - peak wet season
      3: 0.8,  // March - end wet season
      4: 1.0,  // April - dry season starts
      5: 1.1,  // May - dry season
      6: 1.2,  // June - peak dry season
      7: 1.2,  // July - peak dry season
      8: 1.1,  // August - late dry season
      9: 1.0,  // September - end dry season
      10: 0.9, // October - wet season starts
      11: 0.8, // November - early wet season
      12: 0.7  // December - wet season
    };
    
    return seasonalMap[month] || 1.0;
  }

  private assessVolatility(query: string): 'low' | 'medium' | 'high' {
    const highVolatilityProducts = ['cabai', 'bawang merah', 'tomat'];
    const mediumVolatilityProducts = ['jagung', 'kedelai'];
    
    if (highVolatilityProducts.some(product => query.includes(product))) {
      return 'high';
    }
    if (mediumVolatilityProducts.some(product => query.includes(product))) {
      return 'medium';
    }
    return 'low';
  }

  private generateMarketRecommendations(
    sentiment: 'bullish' | 'bearish' | 'neutral',
    seasonalFactor: number,
    volatility: 'low' | 'medium' | 'high'
  ): string[] {
    const recommendations: string[] = [];
    
    if (sentiment === 'bullish' && seasonalFactor > 1.0) {
      recommendations.push('Waktu baik untuk jual - harga sedang tinggi');
    }
    
    if (sentiment === 'bearish' && seasonalFactor < 0.8) {
      recommendations.push('Pertimbangkan tunda penjualan - harga mungkin akan naik');
    }
    
    if (volatility === 'high') {
      recommendations.push('Harga sangat fluktuatif - pantau terus perkembangan pasar');
    }
    
    if (seasonalFactor > 1.1) {
      recommendations.push('Musim kemarau - harga cenderung naik karena supply terbatas');
    }
    
    return recommendations.length > 0 ? recommendations : ['Pantau perkembangan harga secara berkala'];
  }
}