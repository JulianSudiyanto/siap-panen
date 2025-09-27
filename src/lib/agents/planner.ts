// src/lib/agents/planner.ts

export interface Task {
  id: string;
  action: 'tool_call' | 'knowledge_retrieval' | 'direct_response';
  tool_name?: string;
  parameters?: Record<string, any>;
  priority: number;
  dependencies?: string[];
}

export interface ExecutionPlan {
  reasoning: string;
  tasks: Task[];
  response_strategy: 'comprehensive' | 'concise' | 'step_by_step';
}

export class TaskPlanner {
  async createPlan(query: string, contextAnalysis: any, availableTools: string[]): Promise<ExecutionPlan> {
    console.log("🎯 Creating execution plan for:", query);

    const plan: ExecutionPlan = {
      reasoning: this.generateReasoning(query, contextAnalysis),
      tasks: this.generateTasks(query, contextAnalysis, availableTools),
      response_strategy: this.determineResponseStrategy(contextAnalysis)
    };

    console.log("📋 Generated plan:", plan);
    return plan;
  }

  private generateReasoning(query: string, contextAnalysis: any): string {
    const domain = contextAnalysis.agricultural_domain[0] || 'general';
    const queryType = contextAnalysis.query_type;
    const requiredTools = contextAnalysis.requires_tools;

    let reasoning = `User bertanya tentang ${domain} dengan tipe pertanyaan ${queryType}. `;

    if (requiredTools.length > 0) {
      reasoning += `Perlu menggunakan tools: ${requiredTools.join(', ')}. `;
    }

    reasoning += `Akan memberikan respons yang sesuai dengan level ${contextAnalysis.technical_level}.`;

    return reasoning;
  }

  private generateTasks(query: string, contextAnalysis: any, availableTools: string[]): Task[] {
    const tasks: Task[] = [];
    let taskId = 1;

    // Generate tool-based tasks
    for (const toolName of contextAnalysis.requires_tools) {
      if (availableTools.includes(toolName)) {
        tasks.push({
          id: `task_${taskId++}`,
          action: 'tool_call',
          tool_name: toolName,
          parameters: this.generateToolParameters(toolName, query, contextAnalysis),
          priority: this.calculateToolPriority(toolName, contextAnalysis),
          dependencies: []
        });
      }
    }

    // Always add a response task
    tasks.push({
      id: `task_${taskId++}`,
      action: 'direct_response',
      priority: 1,
      dependencies: tasks.map(t => t.id)
    });

    return tasks.sort((a, b) => b.priority - a.priority);
  }

  private generateToolParameters(toolName: string, query: string, contextAnalysis: any): Record<string, any> {
    const queryLower = query.toLowerCase();

    switch (toolName) {
      case 'cekCuaca':
        // Extract location from query or use default
        const locationMatch = queryLower.match(/(bandung|jakarta|surabaya|medan|makassar|\w+)/i);
        return {
          lokasi: locationMatch?.[0] || contextAnalysis.user_location || 'Bandung'
        };

      case 'buatJadwalTanam':
        // Extract crop type from query
        const cropMatch = queryLower.match(/(padi|jagung|kedelai|cabai|tomat|[\w\s]+)/i);
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

  private calculateToolPriority(toolName: string, contextAnalysis: any): number {
    const urgencyMultiplier: Record<string, number> = {
      'high': 3,
      'medium': 2,
      'low': 1
    };
    
    const multiplier = urgencyMultiplier[contextAnalysis.urgency_level as string] || 1;

    const toolPriorities: Record<string, number> = {
      'cekCuaca': 8,
      'buatJadwalTanam': 7,
      'hitungKebutuhan': 6
    };

    const basePriority = toolPriorities[toolName] || 5;
    return basePriority * multiplier;
  }

  private determineResponseStrategy(contextAnalysis: any): 'comprehensive' | 'concise' | 'step_by_step' {
    if (contextAnalysis.technical_level === 'advanced') {
      return 'comprehensive';
    } else if (contextAnalysis.query_type === 'how_to') {
      return 'step_by_step';
    } else {
      return 'concise';
    }
  }
}