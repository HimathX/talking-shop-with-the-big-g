# ADK Advanced Capabilities - 80/20 Deep Dive

## The Full Power of Google ADK

---
zoom: 0.6
---

# ADK Beyond the Basics

## What We Haven't Covered Yet

**Production-Grade Features:**
- **Callbacks & Plugins** - Intercept and modify agent behavior
- **Artifacts Service** - Handle file uploads, images, and blobs
- **Memory Service** - Long-term user memory across sessions
- **Credential Service** - Secure API key and secret management
- **Streaming Modes** - SSE (Server-Sent Events) for real-time responses

**Advanced Agent Types:**
- **Hierarchical Routing** - Dynamic agent transfer based on intent
- **Loop Agents** - Iterative refinement until condition met
- **Custom Agents** - Full control over decision logic

**Enterprise Integration:**
- **MCP (Model Context Protocol)** - Third-party tool integrations
- **A2A Protocol** - Remote agent-to-agent communication
- **Grounding** - Connect to knowledge bases and search

---
zoom: 0.75
---

# Callbacks & Plugins System

## Intercept and Control Agent Behavior

### Tool Callbacks
```typescript
const agent = new LlmAgent({
  name: 'monitored_agent',
  model: 'gemini-2.5-flash',
  tools: [myTool],
  
  // Before tool execution
  beforeToolCallback: async ({tool, args, context}) => {
    console.log(`About to execute: ${tool.name}`);
    // Return undefined to proceed, or return result to skip
    return undefined;
  },
  
  // After tool execution
  afterToolCallback: async ({tool, args, context, response}) => {
    console.log(`Tool ${tool.name} returned:`, response);
    // Optionally modify the response
    return undefined; // Use original response
  },
});
```

**Use Cases:**
- Logging and monitoring
- Input validation before execution
- Response transformation
- Conditional tool execution

---
zoom: 0.75
---

# Custom Plugins

## Extend ADK with Your Own Logic

```typescript
import { BasePlugin, CallbackContext } from '@google/adk';

class MonitoringPlugin extends BasePlugin {
  constructor() {
    super('monitoring_plugin');
  }

  async onUserMessageCallback({userMessage, invocationContext}) {
    console.log('User message received:', userMessage);
    // Log to analytics, validate input, etc.
    return undefined; // Don't modify message
  }

  async onModelCallCallback({request, invocationContext}) {
    console.log('Calling model with:', request);
    // Track token usage, add headers, etc.
    return undefined;
  }

  async onModelErrorCallback({error, invocationContext}) {
    console.error('Model error:', error);
    // Send to error tracking service
    // Implement retry logic
  }
}

// Add plugin to runner
const runner = new Runner({
  agent: myAgent,
  plugins: [new MonitoringPlugin()],
});
```

---
zoom: 0.6
---

# Artifacts Service

## Handle Files, Images, and Blobs

**What are Artifacts?**
- User-uploaded files (images, PDFs, documents)
- Generated content (reports, charts, visualizations)
- Binary data that needs persistent storage

```typescript
import { InMemoryArtifactService } from '@google/adk';

const runner = new Runner({
  agent: myAgent,
  artifactService: new InMemoryArtifactService(),
});

// Run with artifact configuration
for await (const event of runner.runAsync({
  userId: 'user123',
  sessionId: 'session456',
  newMessage: userMessage,
  runConfig: {
    saveInputBlobsAsArtifacts: true, // Save uploaded files
  },
})) {
  // Process events
}
```

**Production Use Cases:**
- Image analysis agents
- Document processing workflows
- Report generation with charts
- Multi-modal AI applications

---
zoom: 0.6
---

# Memory Service

## Long-Term User Memory Across Sessions

**State vs Memory:**
- **State**: Session-scoped, temporary (this conversation)
- **Memory**: User-scoped, persistent (across all conversations)

```typescript
import { InMemoryMemoryService } from '@google/adk';

const runner = new Runner({
  agent: myAgent,
  memoryService: new InMemoryMemoryService(),
});

// Memory persists across sessions
// Example: User preferences, historical data, learned patterns
```

**Use Cases:**
- Remember user preferences permanently
- Build user profiles over time
- Personalization across sessions
- Historical context for recommendations

**Production Implementation:**
- Replace `InMemoryMemoryService` with database-backed service
- Store in PostgreSQL, MongoDB, or Cloud Firestore
- Implement custom `BaseMemoryService`

---
zoom: 0.6
---

# Credential Service

## Secure API Key Management

```typescript
import { BaseCredentialService } from '@google/adk';

class MyCredentialService extends BaseCredentialService {
  async getCredential(credentialName: string) {
    // Fetch from secure storage
    // Google Secret Manager, AWS Secrets Manager, etc.
    return { 
      apiKey: process.env[credentialName] 
    };
  }
}

const runner = new Runner({
  agent: myAgent,
  credentialService: new MyCredentialService(),
});
```

**Best Practices:**
- Never hardcode API keys
- Use environment variables for development
- Use secret management services for production
- Rotate credentials regularly
- Implement credential caching

---
zoom: 0.6
---

# Advanced Generation Config

## Fine-Tune Model Behavior

```typescript
const agent = new LlmAgent({
  name: 'creative_writer',
  model: 'gemini-2.5-flash',
  instruction: 'You are a creative writing assistant.',
  
  generateContentConfig: {
    temperature: 0.9,        // Higher = more creative
    topP: 0.95,              // Nucleus sampling
    topK: 40,                // Top-K sampling
    maxOutputTokens: 2048,   // Response length limit
    candidateCount: 1,       // Number of responses
    
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  },
});
```

**Parameters Explained:**
- **temperature**: 0.0 (deterministic) to 1.0 (creative)
- **topP**: Probability mass for nucleus sampling
- **topK**: Number of top tokens to consider
- **maxOutputTokens**: Control response length
- **safetySettings**: Content filtering

---
zoom: 0.75
---

# Hierarchical Agent Routing

## Dynamic Agent Transfer Based on Intent

```typescript
const technicalAgent = new LlmAgent({
  name: 'technical_support',
  description: 'Handles technical questions and troubleshooting.',
  model: 'gemini-2.5-flash',
  instruction: 'Provide technical support.',
});

const salesAgent = new LlmAgent({
  name: 'sales_support',
  description: 'Handles sales inquiries and pricing.',
  model: 'gemini-2.5-flash',
  instruction: 'Help with sales inquiries.',
});

const mainAgent = new LlmAgent({
  name: 'main_agent',
  description: 'Routes users to specialists.',
  model: 'gemini-2.5-flash',
  instruction: 'Greet users and route to appropriate specialist.',
  subAgents: [technicalAgent, salesAgent],
  // Automatically gets transfer_to_agent tool!
});
```

**How It Works:**
- Main agent analyzes user intent
- Uses `transfer_to_agent` tool automatically
- Seamlessly hands off to specialist
- Specialist handles the conversation

---
zoom: 0.6
---

# Loop Agents

## Iterative Refinement Until Success

```typescript
import { LoopAgent, LlmAgent } from '@google/adk';

const codeGeneratorAgent = new LlmAgent({
  name: 'code_generator',
  model: 'gemini-2.5-flash',
  instruction: 'Generate code and validate it.',
  tools: [generateCodeTool, validateCodeTool],
});

const loopAgent = new LoopAgent({
  name: 'code_loop',
  description: 'Generate and validate code until it works',
  agent: codeGeneratorAgent,
  maxIterations: 5,
  
  // Define success condition
  shouldContinue: (context) => {
    const validationResult = context.state.get('validationResult');
    return !validationResult?.success; // Continue if validation fails
  },
});
```

**Use Cases:**
- Code generation with validation
- Problem-solving with multiple attempts
- Optimization tasks
- Self-correcting workflows

---
zoom: 0.6
---

# Output Schema & Structured Responses

## Force Agents to Return Specific JSON

```typescript
import { Type } from '@google/adk';

const agent = new LlmAgent({
  name: 'data_extractor',
  model: 'gemini-2.5-flash',
  instruction: 'Extract structured data from user input.',
  
  outputSchema: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      age: { type: Type.NUMBER },
      email: { type: Type.STRING },
      interests: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
    required: ['name', 'email'],
  },
});

// Agent MUST return JSON matching this schema
// No free-form text responses allowed
```

**Benefits:**
- Guaranteed data structure
- Easy to parse and validate
- Perfect for API integrations
- Eliminates parsing errors

---
zoom: 0.6
---

# Global vs Local Instructions

## Hierarchical Behavior Control

```typescript
const rootAgent = new LlmAgent({
  name: 'root',
  model: 'gemini-2.5-flash',
  
  // Applies to ALL agents in hierarchy
  globalInstruction: `
    You are friendly, professional, and always use proper grammar.
    Never use slang or informal language.
  `,
  
  // Applies only to this agent
  instruction: `
    You are the main coordinator.
    Route users to appropriate specialists.
  `,
  
  subAgents: [technicalAgent, salesAgent],
});
```

**Use Cases:**
- Consistent brand voice across all agents
- Company-wide policies and guidelines
- Shared safety instructions
- Common formatting rules

---
zoom: 0.6
---

# Streaming Modes

## Real-Time Response Delivery

```typescript
const runner = new Runner({
  agent: myAgent,
  appName: 'StreamingApp',
});

for await (const event of runner.runAsync({
  userId: 'user123',
  sessionId: 'session456',
  newMessage: userMessage,
  
  runConfig: {
    streamingMode: 'SSE', // Server-Sent Events
  },
})) {
  if (event.content) {
    // Stream each token as it's generated
    process.stdout.write(event.content.parts[0].text);
  }
}
```

**Streaming Benefits:**
- Better user experience (see response immediately)
- Lower perceived latency
- Can cancel long responses
- Real-time feedback

**Modes:**
- **SSE**: Server-Sent Events (web standard)
- **WebSocket**: Bidirectional communication
- **Polling**: Fallback for older clients

---
zoom: 0.75
---

# MCP - Model Context Protocol

## Integrate Third-Party Tools

**What is MCP?**
- Standard protocol for connecting AI models to external tools
- Similar to how USB works for devices
- Plug-and-play tool ecosystem

```typescript
import { McpTool } from '@google/adk';

// Use tools from MCP servers
const mcpTool = new McpTool({
  serverUrl: 'https://mcp-server.example.com',
  toolName: 'weather_api',
});

const agent = new LlmAgent({
  name: 'weather_agent',
  model: 'gemini-2.5-flash',
  tools: [mcpTool], // Use external MCP tool
});
```

**Available MCP Tools:**
- Database connectors
- API integrations
- File system access
- Browser automation
- And many more from the community!

---
zoom: 0.6
---

# A2A Protocol

## Agent-to-Agent Communication

**What is A2A?**
- Protocol for remote agent communication
- Different from `AgentTool` (local agents)
- Enables distributed agent systems

```typescript
// Coming soon in ADK TypeScript!
// For now, available in Python ADK

// Example concept:
const remoteAgent = new A2AAgent({
  endpoint: 'https://remote-agent.example.com',
  protocol: 'a2a',
});

const localAgent = new LlmAgent({
  name: 'local_agent',
  model: 'gemini-2.5-flash',
  tools: [remoteAgent], // Call remote agent
});
```

**Use Cases:**
- Microservices architecture
- Cross-organization collaboration
- Specialized agent services
- Scalable agent networks

---
zoom: 0.6
---

# Grounding

## Connect to Knowledge Bases

**What is Grounding?**
- Connect agents to external knowledge sources
- Reduce hallucinations with verified data
- Real-time information access

```typescript
import { GroundingTool } from '@google/adk';

const groundingTool = new GroundingTool({
  source: 'vertex-ai-search',
  datastore: 'my-knowledge-base',
});

const agent = new LlmAgent({
  name: 'grounded_agent',
  model: 'gemini-2.5-flash',
  instruction: 'Answer using verified knowledge base.',
  tools: [groundingTool],
});
```

**Grounding Sources:**
- Vertex AI Search
- Custom knowledge bases
- Enterprise documents
- Real-time data feeds

---
zoom: 0.6
---

# Production Runner Configuration

## Enterprise-Grade Setup

```typescript
import {
  Runner,
  InMemorySessionService,
  InMemoryArtifactService,
  InMemoryMemoryService,
  LoggingPlugin,
} from '@google/adk';

const runner = new Runner({
  appName: 'ProductionApp',
  agent: mainAgent,
  
  // Services
  sessionService: new InMemorySessionService(),
  artifactService: new InMemoryArtifactService(),
  memoryService: new InMemoryMemoryService(),
  credentialService: new MyCredentialService(),
  
  // Plugins
  plugins: [
    new LoggingPlugin('app_logger'),
    new MonitoringPlugin(),
    new AnalyticsPlugin(),
  ],
});
```

**Production Checklist:**
- Replace in-memory services with database-backed
- Implement proper credential management
- Add monitoring and logging plugins
- Configure error tracking
- Set up performance monitoring

---
zoom: 0.6
---

# ADK Capabilities Summary

## The Complete Picture

**Core Features:**
- Multiple agent types (LLM, Sequential, Parallel, Loop, Custom)
- Rich tool ecosystem (FunctionTool, AgentTool, MCP, Built-in)
- Session & state management
- Memory service for long-term context

**Production Features:**
- Callbacks & plugins for extensibility
- Artifact service for file handling
- Credential service for security
- Streaming for real-time responses
- Output schemas for structured data

**Advanced Features:**
- Hierarchical routing & agent transfer
- Global vs local instructions
- Generation config fine-tuning
- MCP for third-party integrations
- A2A for distributed systems
- Grounding for knowledge bases

**The 80/20:** We covered the 20% you need to get started. This is the 80% that makes ADK production-ready!

---
