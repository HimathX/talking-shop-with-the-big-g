# 🏆 Gold Standard Guide: Building AI Agents with Google ADK in TypeScript

*A comprehensive, production-ready guide for building sophisticated AI agents using the Google Agent Development Kit (ADK) in TypeScript.*

---

## 📋 Table of Contents

1. [Introduction to Google ADK](#-introduction-to-google-adk)
2. [Project Setup & Architecture](#-project-setup--architecture)
3. [Core Agent Patterns](#-core-agent-patterns)
4. [Tool Design & Implementation](#-tool-design--implementation)
5. [Multi-Agent Systems](#-multi-agent-systems)
6. [Session Management & State](#-session-management--state)
7. [Streaming & Real-time Features](#-streaming--real-time-features)
8. [Monitoring & Observability](#-monitoring--observability)
9. [Error Handling & Resilience](#-error-handling--resilience)
10. [Testing & Quality Assurance](#-testing--quality-assurance)
11. [Deployment & Production](#-deployment--production)
12. [Advanced Patterns & Best Practices](#-advanced-patterns--best-practices)

---

## 🎯 Introduction to Google ADK

### What is Google ADK?

The **Google Agent Development Kit (ADK)** is an open-source, code-first TypeScript framework for building, evaluating, and deploying sophisticated AI agents with fine-grained control and flexibility. It's designed for developers who need tight integration with Google Cloud services and provides:

- **Code-first approach** - Define agent behavior directly in TypeScript
- **Modular architecture** - Build complex multi-agent systems
- **Rich tool ecosystem** - Integrate with Google Cloud services
- **Enterprise-grade features** - Production-ready with monitoring, callbacks, and plugins
- **Type safety** - Full TypeScript support with Zod validation

### Key Features

```typescript
✅ LLM-powered agents with Gemini models
✅ Custom function tools with Zod validation
✅ Multi-agent orchestration (sequential, parallel, hierarchical)
✅ Session management and state persistence
✅ Real-time streaming (SSE, bidirectional)
✅ Comprehensive monitoring and callbacks
✅ Plugin system for extensibility
✅ Production deployment support
```

---

## 🏗️ Project Setup & Architecture

### 1. Project Structure

```
my-adk-agent/
├── src/
│   ├── agents/           # Agent definitions
│   ├── tools/            # Custom function tools
│   ├── plugins/          # Monitoring plugins
│   ├── runners/          # Custom runners
│   ├── types/            # TypeScript types
│   └── config/           # Configuration files
├── tests/                # Test files
├── docs/                 # Documentation
├── package.json
├── tsconfig.json
└── .env                  # Environment variables
```

### 2. Dependencies & Installation

```json
{
  "dependencies": {
    "@google/adk": "^0.2.0",
    "zod": "^3.22.4",
    "@google/genai": "^0.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

### 3. Environment Configuration

```bash
# .env
GOOGLE_GENAI_API_KEY=your_api_key_here
GOOGLE_CLOUD_PROJECT=your_project_id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_GENAI_USE_VERTEXAI=0  # 0 for Gemini API, 1 for Vertex AI
```

### 4. TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

---

## 🤖 Core Agent Patterns

### 1. Basic LLM Agent

```typescript
import { LlmAgent } from '@google/adk';

const basicAgent = new LlmAgent({
  name: 'basic_assistant',
  model: 'gemini-2.5-flash',
  description: 'A helpful AI assistant',
  instruction: `You are a helpful AI assistant. Be concise and accurate in your responses.`,
  tools: [], // No tools for basic agent
});
```

### 2. Tool-Enabled Agent

```typescript
import { LlmAgent, FunctionTool } from '@google/adk';
import { z } from 'zod';

const searchTool = new FunctionTool({
  name: 'web_search',
  description: 'Search the web for information',
  parameters: z.object({
    query: z.string().describe('Search query'),
    limit: z.number().optional().describe('Maximum results')
  }),
  execute: async ({ query, limit = 5 }) => {
    // Implement web search logic
    return { results: [], total: 0 };
  }
});

const searchAgent = new LlmAgent({
  name: 'search_assistant',
  model: 'gemini-2.5-flash',
  description: 'Web search assistant',
  instruction: `You are a web search assistant. Use the web_search tool to find information when needed.`,
  tools: [searchTool]
});
```

### 3. Structured Output Agent

```typescript
import { LlmAgent } from '@google/adk';
import { z } from 'zod';

const analysisSchema = z.object({
  summary: z.string(),
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  keywords: z.array(z.string()),
  confidence: z.number().min(0).max(1)
});

const structuredAgent = new LlmAgent({
  name: 'content_analyzer',
  model: 'gemini-2.5-flash',
  description: 'Content analysis agent',
  instruction: 'Analyze the provided content and return structured insights.',
  outputSchema: analysisSchema,
  outputKey: 'analysis_result'
});
```

---

## 🛠️ Tool Design & Implementation

### 1. Function Tool Best Practices

```typescript
import { FunctionTool } from '@google/adk';
import { z } from 'zod';

// Comprehensive tool with validation
const emailTool = new FunctionTool({
  name: 'send_email',
  description: 'Send an email to a recipient',
  parameters: z.object({
    to: z.string().email().describe('Recipient email address'),
    subject: z.string().min(1).max(200).describe('Email subject'),
    body: z.string().min(1).max(10000).describe('Email body content'),
    priority: z.enum(['low', 'normal', 'high']).optional().default('normal')
  }),
  execute: async ({ to, subject, body, priority }) => {
    try {
      // Email sending logic
      console.log(`Sending email to ${to} with subject: ${subject}`);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));

      return {
        success: true,
        messageId: `msg_${Date.now()}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
});
```

### 2. Tool Categories & Patterns

#### Data Processing Tools
```typescript
const dataProcessorTool = new FunctionTool({
  name: 'process_data',
  description: 'Process and transform data',
  parameters: z.object({
    data: z.array(z.unknown()),
    operation: z.enum(['filter', 'sort', 'aggregate', 'transform'])
  }),
  execute: async ({ data, operation }) => {
    // Data processing logic
  }
});
```

#### API Integration Tools
```typescript
const apiTool = new FunctionTool({
  name: 'call_external_api',
  description: 'Call external REST API',
  parameters: z.object({
    url: z.string().url(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
    headers: z.record(z.string()).optional(),
    body: z.unknown().optional()
  }),
  execute: async ({ url, method, headers, body }) => {
    // HTTP request logic with proper error handling
  }
});
```

#### Stateful Tools
```typescript
class CacheTool extends FunctionTool {
  private cache = new Map<string, any>();

  constructor() {
    super({
      name: 'cache_operation',
      description: 'Cache data operations',
      parameters: z.object({
        operation: z.enum(['get', 'set', 'delete', 'clear']),
        key: z.string().optional(),
        value: z.unknown().optional(),
        ttl: z.number().optional()
      }),
      execute: async ({ operation, key, value, ttl }) => {
        switch (operation) {
          case 'get':
            return { value: this.cache.get(key) };
          case 'set':
            this.cache.set(key, value);
            return { success: true };
          case 'delete':
            return { deleted: this.cache.delete(key) };
          case 'clear':
            this.cache.clear();
            return { cleared: true };
        }
      }
    });
  }
}
```

### 3. Tool Validation & Error Handling

```typescript
const robustTool = new FunctionTool({
  name: 'robust_operation',
  description: 'A robust tool with comprehensive error handling',
  parameters: z.object({
    input: z.string().min(1).max(1000),
    options: z.object({
      timeout: z.number().min(1000).max(30000).optional(),
      retries: z.number().min(0).max(5).optional()
    }).optional()
  }),
  execute: async ({ input, options = {} }) => {
    // Input validation
    if (!input || input.trim().length === 0) {
      throw new Error('Input cannot be empty');
    }

    const { timeout = 5000, retries = 3 } = options;

    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        // Operation logic with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch('https://api.example.com/process', {
          method: 'POST',
          body: JSON.stringify({ input }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        return { success: true, data: result, attempts: attempt };

      } catch (error) {
        if (attempt > retries) {
          throw new Error(`Operation failed after ${retries} retries: ${error.message}`);
        }
        console.warn(`Attempt ${attempt} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
});
```

---

## 🏢 Multi-Agent Systems

### 1. Hierarchical Agent Routing

```typescript
import { LlmAgent } from '@google/adk';

const technicalSupportAgent = new LlmAgent({
  name: 'technical_support',
  model: 'gemini-2.5-flash',
  description: 'Handles technical issues and troubleshooting',
  instruction: `You are a technical support specialist. Help users with technical problems.`,
  tools: [/* technical tools */]
});

const salesAgent = new LlmAgent({
  name: 'sales_agent',
  model: 'gemini-2.5-flash',
  description: 'Handles sales inquiries and product information',
  instruction: `You are a sales representative. Help customers with product information and purchases.`,
  tools: [/* sales tools */]
});

const billingAgent = new LlmAgent({
  name: 'billing_agent',
  model: 'gemini-2.5-flash',
  description: 'Handles billing and payment issues',
  instruction: `You are a billing specialist. Help with invoices, payments, and account issues.`,
  tools: [/* billing tools */]
});

// Main routing agent
const mainAgent = new LlmAgent({
  name: 'customer_service_hub',
  model: 'gemini-2.5-flash',
  description: 'Main customer service agent that routes to specialists',
  instruction: `You are the main customer service agent. Analyze the user's request and route them to the appropriate specialist:

  - Technical issues → technical_support
  - Sales inquiries → sales_agent
  - Billing problems → billing_agent

  Use the transfer_to_agent tool when routing is needed.`,
  subAgents: [technicalSupportAgent, salesAgent, billingAgent]
});
```

### 2. Sequential Agent Pipeline

```typescript
import { LlmAgent, SequentialAgent } from '@google/adk';

const dataExtractor = new LlmAgent({
  name: 'data_extractor',
  model: 'gemini-2.5-flash',
  instruction: 'Extract key information from user input',
  outputKey: 'extracted_data',
  outputSchema: z.object({
    entities: z.array(z.string()),
    intent: z.string(),
    urgency: z.enum(['low', 'medium', 'high'])
  })
});

const analyzer = new LlmAgent({
  name: 'analyzer',
  model: 'gemini-2.5-flash',
  instruction: 'Analyze the extracted data: {{extracted_data}}',
  outputKey: 'analysis_result'
});

const responder = new LlmAgent({
  name: 'responder',
  model: 'gemini-2.5-flash',
  instruction: 'Generate response based on analysis: {{analysis_result}}'
});

// Sequential pipeline
const processingPipeline = new SequentialAgent({
  name: 'data_processing_pipeline',
  subAgents: [dataExtractor, analyzer, responder]
});
```

### 3. Parallel Agent Execution

```typescript
import { LlmAgent, ParallelAgent } from '@google/adk';

const optimisticAnalyzer = new LlmAgent({
  name: 'optimistic_view',
  model: 'gemini-2.5-flash',
  instruction: 'Analyze the situation from an optimistic perspective',
  outputKey: 'optimistic_analysis'
});

const pessimisticAnalyzer = new LlmAgent({
  name: 'pessimistic_view',
  model: 'gemini-2.5-flash',
  instruction: 'Analyze the situation from a cautious perspective',
  outputKey: 'pessimistic_analysis'
});

const realisticAnalyzer = new LlmAgent({
  name: 'realistic_view',
  model: 'gemini-2.5-flash',
  instruction: 'Analyze the situation realistically',
  outputKey: 'realistic_analysis'
});

// Parallel execution for multiple perspectives
const multiPerspectiveAnalyzer = new ParallelAgent({
  name: 'multi_perspective_analysis',
  description: 'Generate multiple analytical perspectives simultaneously',
  subAgents: [optimisticAnalyzer, pessimisticAnalyzer, realisticAnalyzer]
});
```

### 4. Loop-Based Agents

```typescript
import { LlmAgent, LoopAgent } from '@google/adk';

const iterativeSolver = new LlmAgent({
  name: 'problem_solver',
  model: 'gemini-2.5-flash',
  instruction: `Solve the problem iteratively. If not solved, continue to the next iteration.
  Mark as complete when finished.`,
  tools: [/* problem-solving tools */],
  outputKey: 'solution_status',
  outputSchema: z.object({
    solved: z.boolean(),
    solution: z.string().optional(),
    next_steps: z.array(z.string()).optional()
  })
});

const iterativeProblemSolver = new LoopAgent({
  name: 'iterative_solver',
  subAgents: [iterativeSolver],
  maxIterations: 5  // Prevent infinite loops
});
```

---

## 💾 Session Management & State

### 1. Session Service Implementation

```typescript
import { InMemorySessionService, BaseSessionService } from '@google/adk';

class PersistentSessionService extends BaseSessionService {
  private sessions = new Map<string, any>();

  async createSession({ appName, userId, sessionId, state = {} }: {
    appName: string;
    userId: string;
    sessionId: string;
    state?: any;
  }) {
    const key = `${appName}:${userId}:${sessionId}`;
    const session = {
      id: sessionId,
      appName,
      userId,
      state,
      events: [],
      lastUpdateTime: Date.now()
    };

    this.sessions.set(key, session);
    return session;
  }

  async getSession({ appName, userId, sessionId }: {
    appName: string;
    userId: string;
    sessionId: string;
  }) {
    const key = `${appName}:${userId}:${sessionId}`;
    return this.sessions.get(key) || null;
  }

  async appendEvent({ session, event }: { session: any; event: any }) {
    session.events.push(event);
    session.lastUpdateTime = Date.now();

    // Persist to storage if needed
    await this.persistSession(session);
  }

  private async persistSession(session: any) {
    // Implement persistence logic (database, file, etc.)
    console.log(`Persisting session ${session.id}`);
  }
}
```

### 2. State Management Patterns

```typescript
import { LlmAgent } from '@google/adk';

const statefulAgent = new LlmAgent({
  name: 'stateful_agent',
  model: 'gemini-2.5-flash',
  instruction: `You are a stateful agent. Access and update conversation state as needed.

  Current user preferences: {{user_preferences}}
  Conversation history: {{conversation_summary}}
  `,
  tools: [
    new FunctionTool({
      name: 'update_preferences',
      description: 'Update user preferences in state',
      parameters: z.object({
        key: z.string(),
        value: z.unknown()
      }),
      execute: async ({ key, value }, { state }) => {
        if (!state.user_preferences) {
          state.user_preferences = {};
        }
        state.user_preferences[key] = value;
        return { updated: true, key, value };
      }
    })
  ]
});
```

### 3. Memory Integration

```typescript
import { InMemoryMemoryService } from '@google/adk';

const memoryService = new InMemoryMemoryService();

const agentWithMemory = new LlmAgent({
  name: 'memory_agent',
  model: 'gemini-2.5-flash',
  instruction: 'Use memory to recall previous conversations and preferences.',
  tools: [
    new FunctionTool({
      name: 'recall_memory',
      description: 'Recall information from memory',
      parameters: z.object({
        query: z.string().describe('What to search for in memory')
      }),
      execute: async ({ query }, { invocationContext }) => {
        const memories = await invocationContext.memoryService.searchMemory({
          appName: invocationContext.appName,
          userId: invocationContext.userId,
          query
        });
        return { memories: memories.memories };
      }
    })
  ]
});
```

---

## 🌊 Streaming & Real-time Features

### 1. Server-Sent Events (SSE) Streaming

```typescript
import { InMemoryRunner, StreamingMode } from '@google/adk';
import { createUserContent } from '@google/genai';

const runner = new InMemoryRunner({
  agent: streamingAgent,
  appName: 'streaming_app'
});

// SSE Streaming
async function handleStreamingConversation(userId: string, sessionId: string, message: string) {
  const responses: string[] = [];

  try {
    for await (const event of runner.runAsync({
      userId,
      sessionId,
      newMessage: createUserContent(message),
      runConfig: {
        streamingMode: StreamingMode.SSE
      }
    })) {
      if (event.content?.parts?.[0]?.text) {
        const chunk = event.content.parts[0].text;
        responses.push(chunk);

        // Stream chunk to client (SSE)
        yield `data: ${JSON.stringify({ chunk, done: false })}\n\n`;
      }

      if (event.final) {
        yield `data: ${JSON.stringify({ done: true })}\n\n`;
        break;
      }
    }
  } catch (error) {
    yield `data: ${JSON.stringify({ error: error.message, done: true })}\n\n`;
  }
}
```

### 2. Bidirectional Streaming

```typescript
// For bidirectional streaming (real-time voice/video)
const bidiRunner = new InMemoryRunner({
  agent: voiceAgent,
  appName: 'voice_app'
});

async function handleBidirectionalStreaming(socket: WebSocket) {
  socket.on('message', async (data) => {
    const message = JSON.parse(data.toString());

    if (message.type === 'audio') {
      // Handle incoming audio
      const transcription = await transcribeAudio(message.audio);

      for await (const event of bidiRunner.runAsync({
        userId: message.userId,
        sessionId: message.sessionId,
        newMessage: createUserContent(transcription),
        runConfig: {
          streamingMode: StreamingMode.BIDI
        }
      })) {
        if (event.content?.parts?.[0]?.text) {
          // Send response back through socket
          socket.send(JSON.stringify({
            type: 'response',
            text: event.content.parts[0].text
          }));
        }
      }
    }
  });
}
```

### 3. Streaming with Callbacks

```typescript
const streamingAgent = new LlmAgent({
  name: 'streaming_agent',
  model: 'gemini-2.5-flash',
  instruction: 'Provide responses with streaming enabled',

  // Monitor streaming progress
  afterModelCallback: async ({ response }) => {
    if (response.partial) {
      console.log('Streaming chunk received');
    }
    if (response.finishReason) {
      console.log('Streaming completed:', response.finishReason);
    }
  }
});
```

---

## 📊 Monitoring & Observability

### 1. Custom Monitoring Plugin

```typescript
import { BasePlugin, CallbackContext, LlmRequest, LlmResponse } from '@google/adk';

class ComprehensiveMonitoringPlugin extends BasePlugin {
  private metrics = {
    requests: 0,
    errors: 0,
    toolCalls: 0,
    averageResponseTime: 0
  };

  constructor() {
    super('comprehensive_monitoring');
  }

  async beforeRunCallback({ invocationContext }) {
    console.log(`🚀 Starting invocation: ${invocationContext.invocationId}`);
    this.metrics.requests++;
    invocationContext.startTime = Date.now();
  }

  async afterRunCallback({ invocationContext }) {
    const duration = Date.now() - invocationContext.startTime;
    console.log(`✅ Completed invocation: ${invocationContext.invocationId} (${duration}ms)`);
  }

  async beforeModelCallback({ request }) {
    console.log(`🤖 Model call: ${request.model}`);
  }

  async afterModelCallback({ response }) {
    console.log(`📄 Response received: ${response.usageMetadata?.candidatesTokenCount || 0} tokens`);
  }

  async beforeToolCallback({ tool, toolArgs }) {
    console.log(`🔧 Tool call: ${tool.name}`);
    this.metrics.toolCalls++;
  }

  async onModelErrorCallback({ error }) {
    console.error(`❌ Model error: ${error.message}`);
    this.metrics.errors++;
  }

  async onToolErrorCallback({ tool, error }) {
    console.error(`❌ Tool error in ${tool.name}: ${error.message}`);
    this.metrics.errors++;
  }

  getMetrics() {
    return { ...this.metrics };
  }
}
```

### 2. Agent with Callbacks

```typescript
const monitoredAgent = new LlmAgent({
  name: 'monitored_agent',
  model: 'gemini-2.5-flash',
  instruction: 'Monitored agent with comprehensive callbacks',

  beforeModelCallback: async ({ request }) => {
    console.log(`[BEFORE MODEL] ${request.model} - ${request.contents.length} messages`);
    // Rate limiting logic
    // Request modification
    return undefined; // Continue with request
  },

  afterModelCallback: async ({ response }) => {
    console.log(`[AFTER MODEL] ${response.finishReason} - ${response.usageMetadata?.totalTokenCount || 0} tokens`);
    // Response filtering/modification
    return undefined; // Use original response
  },

  beforeToolCallback: async ({ tool, args }) => {
    console.log(`[TOOL START] ${tool.name} with args:`, args);
    // Tool validation, logging, etc.
    return undefined; // Execute tool
  },

  afterToolCallback: async ({ tool, response }) => {
    console.log(`[TOOL END] ${tool.name} returned:`, response);
    // Response post-processing
    return undefined; // Use original response
  }
});
```

### 3. Logging Plugin Implementation

```typescript
import { BasePlugin } from '@google/adk';

class StructuredLoggingPlugin extends BasePlugin {
  constructor(private logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info') {
    super('structured_logging');
  }

  private log(level: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      plugin: this.name,
      message,
      data
    };

    if (level === 'error' || this.logLevel === 'debug') {
      console.log(JSON.stringify(logEntry, null, 2));
    }
  }

  async onUserMessageCallback({ userMessage, invocationContext }) {
    this.log('info', 'User message received', {
      invocationId: invocationContext.invocationId,
      messageLength: userMessage.parts?.[0]?.text?.length || 0
    });
  }

  async onEventCallback({ invocationContext, event }) {
    this.log('debug', 'Agent event', {
      invocationId: invocationContext.invocationId,
      eventType: event.author,
      hasContent: !!event.content
    });
  }
}
```

---

## 🛡️ Error Handling & Resilience

### 1. Robust Agent Configuration

```typescript
const resilientAgent = new LlmAgent({
  name: 'resilient_agent',
  model: 'gemini-2.5-flash',
  instruction: `You are a resilient agent. Handle errors gracefully and provide helpful responses even when things go wrong.`,

  // Error handling callbacks
  onModelErrorCallback: async ({ error }) => {
    console.error('Model error:', error);

    // Provide fallback response
    return {
      content: {
        parts: [{
          text: "I'm experiencing some technical difficulties. Please try again in a moment, or rephrase your request."
        }]
      }
    };
  },

  onToolErrorCallback: async ({ tool, error }) => {
    console.error(`Tool ${tool.name} error:`, error);

    // Attempt recovery or provide alternative
    return {
      error: `The ${tool.name} tool is currently unavailable. Let me try a different approach.`,
      recovery_attempted: true
    };
  }
});
```

### 2. Circuit Breaker Pattern

```typescript
class CircuitBreakerTool extends FunctionTool {
  private failures = 0;
  private lastFailureTime = 0;
  private readonly threshold = 3;
  private readonly timeout = 60000; // 1 minute

  constructor(private wrappedTool: FunctionTool) {
    super(wrappedTool);
    this.name = wrappedTool.name;
    this.description = wrappedTool.description;
    this.parameters = wrappedTool.parameters;
  }

  async execute(args: any, context?: any) {
    // Check if circuit breaker is open
    if (this.isCircuitOpen()) {
      throw new Error(`Circuit breaker is open for ${this.name}. Service temporarily unavailable.`);
    }

    try {
      const result = await this.wrappedTool.execute(args, context);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private isCircuitOpen(): boolean {
    if (this.failures < this.threshold) return false;

    // Check if timeout has passed
    if (Date.now() - this.lastFailureTime > this.timeout) {
      this.reset();
      return false;
    }

    return true;
  }

  private onSuccess() {
    if (this.failures > 0) {
      this.failures = Math.max(0, this.failures - 1);
    }
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
  }

  private reset() {
    this.failures = 0;
    this.lastFailureTime = 0;
  }
}
```

### 3. Retry Logic & Exponential Backoff

```typescript
function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        const result = await operation();
        resolve(result);
        return;
      } catch (error) {
        if (attempt > maxRetries) {
          reject(new Error(`Operation failed after ${maxRetries} retries: ${error.message}`));
          return;
        }

        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  });
}

// Usage in tool
const retryingTool = new FunctionTool({
  name: 'reliable_api_call',
  description: 'Make API calls with retry logic',
  parameters: z.object({ url: z.string().url() }),
  execute: async ({ url }) => {
    return withRetry(async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      return response.json();
    });
  }
});
```

---

## 🧪 Testing & Quality Assurance

### 1. Unit Testing for Tools

```typescript
// tools.test.ts
import { describe, it, expect, jest } from '@jest/globals';
import { emailTool } from '../src/tools/email';

describe('Email Tool', () => {
  it('should send email successfully', async () => {
    const mockSend = jest.fn().mockResolvedValue({ messageId: '123' });

    // Mock the email service
    (global as any).emailService = { send: mockSend };

    const result = await emailTool.execute({
      to: 'user@example.com',
      subject: 'Test Subject',
      body: 'Test Body'
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('123');
    expect(mockSend).toHaveBeenCalledWith({
      to: 'user@example.com',
      subject: 'Test Subject',
      body: 'Test Body',
      priority: 'normal'
    });
  });

  it('should validate email format', async () => {
    await expect(emailTool.execute({
      to: 'invalid-email',
      subject: 'Test',
      body: 'Test'
    })).rejects.toThrow('Invalid email');
  });
});
```

### 2. Agent Integration Testing

```typescript
// agent.test.ts
import { InMemoryRunner } from '@google/adk';
import { createUserContent } from '@google/genai';
import { searchAgent } from '../src/agents/search';

describe('Search Agent', () => {
  let runner: InMemoryRunner;

  beforeEach(() => {
    runner = new InMemoryRunner({
      agent: searchAgent,
      appName: 'test_app'
    });
  });

  it('should handle search queries', async () => {
    const responses: string[] = [];

    for await (const event of runner.runAsync({
      userId: 'test_user',
      sessionId: 'test_session',
      newMessage: createUserContent('Search for TypeScript tutorials')
    })) {
      if (event.content?.parts?.[0]?.text) {
        responses.push(event.content.parts[0].text);
      }
    }

    expect(responses.length).toBeGreaterThan(0);
    expect(responses[0]).toMatch(/search|tutorial|typescript/i);
  });

  it('should maintain conversation state', async () => {
    // Test multi-turn conversation
    const sessionId = 'state_test_' + Date.now();

    // First message
    for await (const event of runner.runAsync({
      userId: 'test_user',
      sessionId,
      newMessage: createUserContent('I want to learn React')
    })) { /* consume */ }

    // Second message referencing previous context
    const responses: string[] = [];
    for await (const event of runner.runAsync({
      userId: 'test_user',
      sessionId,
      newMessage: createUserContent('Show me beginner tutorials')
    })) {
      if (event.content?.parts?.[0]?.text) {
        responses.push(event.content.parts[0].text);
      }
    }

    expect(responses.some(r => r.includes('React'))).toBe(true);
  });
});
```

### 3. Load Testing

```typescript
// load.test.ts
import { InMemoryRunner } from '@google/adk';
import { performanceAgent } from '../src/agents/performance';

describe('Load Testing', () => {
  it('should handle concurrent requests', async () => {
    const runner = new InMemoryRunner({
      agent: performanceAgent,
      appName: 'load_test'
    });

    const concurrentRequests = 10;
    const promises = [];

    for (let i = 0; i < concurrentRequests; i++) {
      const promise = (async () => {
        const startTime = Date.now();
        let responseCount = 0;

        for await (const event of runner.runAsync({
          userId: `user_${i}`,
          sessionId: `session_${i}`,
          newMessage: createUserContent(`Request ${i}`)
        })) {
          responseCount++;
        }

        return {
          duration: Date.now() - startTime,
          responseCount
        };
      })();

      promises.push(promise);
    }

    const results = await Promise.all(promises);

    // Analyze results
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const totalResponses = results.reduce((sum, r) => sum + r.responseCount, 0);

    console.log(`Average response time: ${avgDuration}ms`);
    console.log(`Total responses: ${totalResponses}`);

    expect(avgDuration).toBeLessThan(5000); // Less than 5 seconds
    expect(totalResponses).toBe(concurrentRequests);
  });
});
```

---

## 🚀 Deployment & Production

### 1. Production Runner Configuration

```typescript
import {
  Runner,
  InMemorySessionService,
  GcsArtifactService,
  InMemoryMemoryService,
  LoggingPlugin
} from '@google/adk';

class ProductionCredentialService {
  async getCredential(credentialName: string) {
    // Fetch from secure secret manager
    return { apiKey: process.env[credentialName] };
  }
}

const productionRunner = new Runner({
  appName: 'production_app',
  agent: mainAgent,
  sessionService: new InMemorySessionService(), // Use Redis/Persistent in production
  artifactService: new GcsArtifactService('your-gcs-bucket'),
  memoryService: new InMemoryMemoryService(), // Use Vector DB in production
  credentialService: new ProductionCredentialService(),
  plugins: [
    new LoggingPlugin('production_logger'),
    new MonitoringPlugin(),
    new SecurityPlugin()
  ]
});
```

### 2. Environment-Specific Configuration

```typescript
// config/production.ts
export const productionConfig = {
  agent: {
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      }
    ]
  },
  runner: {
    streamingMode: StreamingMode.SSE,
    maxLlmCalls: 100,
    supportCfc: true
  },
  monitoring: {
    enableMetrics: true,
    logLevel: 'info',
    alertThresholds: {
      errorRate: 0.05,
      responseTime: 3000
    }
  }
};
```

### 3. Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY dist/ ./dist/
COPY .env ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

USER nextjs

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

### 4. Health Checks & Monitoring

```typescript
// health.ts
import { productionRunner } from './runner';

export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  checks: Record<string, boolean>;
  timestamp: string;
}> {
  const checks = {
    apiConnectivity: false,
    databaseConnection: false,
    agentResponsiveness: false,
    memoryUsage: false
  };

  try {
    // Test API connectivity
    checks.apiConnectivity = await testApiConnectivity();

    // Test database/memory services
    checks.databaseConnection = await testDatabaseConnection();

    // Test agent responsiveness
    checks.agentResponsiveness = await testAgentResponsiveness(productionRunner);

    // Check memory usage
    checks.memoryUsage = process.memoryUsage().heapUsed < 500 * 1024 * 1024; // 500MB

  } catch (error) {
    console.error('Health check failed:', error);
  }

  const allHealthy = Object.values(checks).every(check => check);

  return {
    status: allHealthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString()
  };
}

async function testAgentResponsiveness(runner: Runner): Promise<boolean> {
  try {
    const startTime = Date.now();

    for await (const event of runner.runAsync({
      userId: 'health_check',
      sessionId: 'health_' + Date.now(),
      newMessage: createUserContent('Hello'),
      runConfig: { streamingMode: StreamingMode.NONE }
    })) {
      if (event.content && Date.now() - startTime < 5000) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}
```

---

## 🎨 Advanced Patterns & Best Practices

### 1. Agent Composition Patterns

```typescript
// Decorator pattern for agents
function withCaching<T extends new (...args: any[]) => LlmAgent>(BaseAgent: T) {
  return class CachedAgent extends BaseAgent {
    private cache = new Map<string, any>();

    async runAsync(...args: any[]) {
      const cacheKey = JSON.stringify(args);

      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      const result = await super.runAsync(...args);
      this.cache.set(cacheKey, result);

      return result;
    }
  };
}

// Usage
const CachedSearchAgent = withCaching(LlmAgent);
const cachedAgent = new CachedSearchAgent({
  name: 'cached_search',
  model: 'gemini-2.5-flash',
  instruction: 'Cached search agent'
});
```

### 2. Dynamic Agent Creation

```typescript
function createSpecializedAgent(domain: string, tools: FunctionTool[]) {
  const domainPrompts = {
    medical: 'You are a medical assistant. Provide accurate health information.',
    legal: 'You are a legal assistant. Provide general legal information.',
    financial: 'You are a financial advisor. Provide financial guidance.'
  };

  return new LlmAgent({
    name: `${domain}_assistant`,
    model: 'gemini-2.5-flash',
    description: `${domain.charAt(0).toUpperCase() + domain.slice(1)} assistant`,
    instruction: domainPrompts[domain] || 'You are a helpful assistant.',
    tools
  });
}

// Usage
const medicalAgent = createSpecializedAgent('medical', [diagnosisTool, prescriptionTool]);
const legalAgent = createSpecializedAgent('legal', [contractAnalysisTool]);
```

### 3. Agent Versioning & A/B Testing

```typescript
class AgentVersionManager {
  private versions = new Map<string, LlmAgent>();

  registerVersion(name: string, version: string, agent: LlmAgent) {
    const key = `${name}:${version}`;
    this.versions.set(key, agent);
  }

  getAgent(name: string, version?: string): LlmAgent {
    if (!version) {
      // A/B testing logic
      version = Math.random() > 0.5 ? 'v1' : 'v2';
    }

    const key = `${name}:${version}`;
    const agent = this.versions.get(key);

    if (!agent) {
      throw new Error(`Agent ${key} not found`);
    }

    return agent;
  }

  compareVersions(agentName: string, versions: string[], testQuery: string) {
    const results = [];

    for (const version of versions) {
      const agent = this.getAgent(agentName, version);
      const startTime = Date.now();

      // Run test query
      const result = this.runTestQuery(agent, testQuery);
      const duration = Date.now() - startTime;

      results.push({
        version,
        duration,
        result
      });
    }

    return results;
  }
}
```

### 4. Context-Aware Agent Behavior

```typescript
const contextAwareAgent = new LlmAgent({
  name: 'context_aware_agent',
  model: 'gemini-2.5-flash',
  instruction: `You are a context-aware agent. Adapt your behavior based on:

  User context: {{user_context}}
  Time of day: {{time_context}}
  Conversation history: {{conversation_context}}
  User preferences: {{user_preferences}}

  Provide personalized responses based on this context.`,

  // Dynamic instruction generation
  beforeModelCallback: async ({ context, request }) => {
    const userContext = await getUserContext(context.invocationContext);
    const timeContext = getTimeContext();
    const conversationContext = await getConversationSummary(context.invocationContext);
    const userPreferences = await getUserPreferences(context.invocationContext);

    // Inject context into the instruction
    const enhancedInstruction = request.contents[0].parts[0].text
      .replace('{{user_context}}', userContext)
      .replace('{{time_context}}', timeContext)
      .replace('{{conversation_context}}', conversationContext)
      .replace('{{user_preferences}}', JSON.stringify(userPreferences));

    request.contents[0].parts[0].text = enhancedInstruction;

    return undefined;
  }
});
```

---

## 📚 Additional Resources

### Official Documentation
- [Google ADK GitHub](https://github.com/google/adk-js)
- [ADK API Reference](https://google.github.io/adk-js/)
- [Gemini API Documentation](https://ai.google.dev/docs)

### Best Practices
- Use Zod for all input/output validation
- Implement comprehensive error handling
- Add monitoring and logging from day one
- Test agents with various input scenarios
- Use structured outputs for predictable results

### Performance Tips
- Cache frequently used responses
- Use streaming for better user experience
- Implement rate limiting for production
- Monitor token usage and costs
- Optimize tool execution with circuit breakers

This guide provides a comprehensive foundation for building production-ready AI agents with Google ADK. Start with the basic patterns and gradually incorporate advanced features as your needs grow! 🚀✨