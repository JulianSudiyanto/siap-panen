// src/lib/agents/memory.ts

export interface ConversationState {
  conversationId: string;
  messages: any[];
  context: Record<string, any>;
  toolHistory: ToolCall[];
  userPreferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface ToolCall {
  toolName: string;
  parameters: Record<string, any>;
  result: any;
  timestamp: Date;
  success: boolean;
}

export interface UserPreferences {
  location?: string;
  farmType?: string;
  experienceLevel?: 'beginner' | 'intermediate' | 'expert';
  responseStyle?: 'detailed' | 'concise';
}

export class ConversationMemory {
  private conversationId: string;
  private memoryStore: Map<string, ConversationState> = new Map();
  
  constructor(conversationId?: string) {
    this.conversationId = conversationId || this.generateConversationId();
  }

  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async loadState(): Promise<ConversationState | null> {
    const state = this.memoryStore.get(this.conversationId);
    
    if (!state) {
      console.log(`🧠 Creating new conversation: ${this.conversationId}`);
      return this.initializeNewConversation();
    }
    
    console.log(`🧠 Loaded conversation: ${this.conversationId}`);
    return state;
  }

  async saveState(state: ConversationState): Promise<void> {
    state.updatedAt = new Date();
    this.memoryStore.set(this.conversationId, state);
    console.log(`💾 Saved conversation state: ${this.conversationId}`);
  }

  private initializeNewConversation(): ConversationState {
    return {
      conversationId: this.conversationId,
      messages: [],
      context: {},
      toolHistory: [],
      userPreferences: {
        responseStyle: 'detailed'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async updateContext(contextUpdates: Record<string, any>): Promise<void> {
    const state = await this.loadState();
    if (state) {
      state.context = { ...state.context, ...contextUpdates };
      await this.saveState(state);
    }
  }

  async addToolCall(toolCall: ToolCall): Promise<void> {
    const state = await this.loadState();
    if (state) {
      state.toolHistory.push(toolCall);
      // Keep only last 20 tool calls
      if (state.toolHistory.length > 20) {
        state.toolHistory = state.toolHistory.slice(-20);
      }
      await this.saveState(state);
    }
  }

  getConversationId(): string {
    return this.conversationId;
  }
}