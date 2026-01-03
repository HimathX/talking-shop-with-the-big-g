---
theme: apple-basic
title: Building AI Agents with ADK - The Foundationy
info: |
  ## ADK Foundation Session
  Understanding the core concepts and architecture of Google ADK for building AI agents.

  Presented by: Mithushan J
class: text-center
transition: slide-left
mdc: true
duration: 30min
zoom: 0.75
---

---
layout: intro
---

# Building AI Agents with Google ADK

## The Foundation

**DevFest 2025 Sri Lanka**

Understanding the core concepts before hands-on implementation

*Presented by: Mithushan Jalangan. Co-Founder/Tech Asyncdot*

---
zoom: 0.85
---

# Learning Objectives

## What You'll Learn Today

- **Understand ADK core concepts and architecture**
- **Master multi-turn conversation patterns**
- **Implement session state management**
- **Build context-aware Function Tools**
- **Handle conversation history and events**
- **Create stateful AI agent applications**

---
zoom: 0.85
---

# What We'll Build

## Personal Finance Review Agent

**A working AI agent that can:**
- **Analyze** spending transactions and categorize them
- **Track** budget goals and spending limits
- **Monitor** budget status with percentage calculations
- **Generate** comprehensive spending reports

**By the end of this session, you'll understand:**
- How agents maintain context across multiple conversation turns
- How to store and reference session state
- How to build multi-turn conversational AI applications

---
zoom: 0.85
---
# Agenda

## Session Overview

**Part 1: Core Concepts** (25 min)
- What is Google ADK?
- Agent Architecture & Theory
- Function Calling & Zod Foundation
- First Principles of AI Agents
- Key Components & Design Patterns

**Part 2: Code Implementation** (15 min)
- Basic Agent Setup
- Tools & Functions
- Sessions & State
- Live Demo Preview

---
layout: intro-image-right
image: '/images/gdg-qrcode.png'
---

# Download Demo
## Scan to explore the code

---
layout: intro-image-right
image: '/images/learn_more.png'
---

# Learn More
## Explore More. Chat more (with resources)

---
zoom: 0.9
---

# What is Google ADK?

## Agent Development Kit

**Open-source TypeScript framework** for building AI agents with a code-first approach.

**Key Features:**
- Agent Development Kit - TypeScript framework
- Code-first approach for AI agents
- Google Cloud integration
- Production-ready architecture

**Key Benefits:**
- Type Safety - Full TypeScript support
- Debugging - Standard debugging tools
- Versioning - Git-friendly code
- Deployment - Anywhere (local → cloud)

---
zoom: 0.9
---

# Agent Architecture

## The ADK Building Blocks

### LLM Agent
Core intelligence powered by Gemini models

```typescript
const agent = new LlmAgent({
  name: 'personal_finance_advisor',
  model: 'gemini-2.5-flash',
  instruction: `You are a helpful personal finance advisor.
  Help users understand and manage their spending across multiple conversation turns.`,
  tools: [/* finance tools will be added here */]
});
```

**Key Properties:**
- `name` - Unique identifier for the agent
- `model` - Gemini model to use (e.g., gemini-2.5-flash)
- `instruction` - System prompt that guides agent behavior
- `tools` - Array of FunctionTools available to the agent

---
zoom: 0.70
---
# Agent Architecture (2/3)

## Function Tools

### Extend Agent Capabilities

Function Tools allow agents to perform custom actions and computations:

```typescript
const analyzeTransactionsTool = new FunctionTool({
  name: 'analyze_transactions',
  description: 'Analyze spending transactions and categorize them by type',
  parameters: z.object({
    transactions: z.array(
      z.object({
        date: z.string().describe('Transaction date'),
        description: z.string().describe('Transaction description'),
        amount: z.number().positive().describe('Amount spent'),
        category: z.enum(['groceries', 'dining', 'entertainment', 'utilities', 'transport', 'other'])
      })
    ).describe('List of transactions to analyze')
  }),
  execute: ({ transactions }) => {
    // Calculate spending by category
    const categories: Record<string, number> = {};
    let totalSpent = 0;

    transactions.forEach((tx) => {
      categories[tx.category] = (categories[tx.category] || 0) + tx.amount;
      totalSpent += tx.amount;
    });

    return {
      status: 'success',
      analysis: { totalSpent, categories },
      summary: `Analyzed ${transactions.length} transactions totaling $${totalSpent.toFixed(2)}`
    };
  }
});
```

---
zoom: 0.8
---

# Agent Architecture (3/3)

## Runner & The Agent Loop

### Runner - Execution Environment

```typescript
const runner = new InMemoryRunner({
  agent: agent,
  appName: 'research_app'
});
```

**Runner manages:**
- Session creation and storage
- Conversation history
- State persistence
- Event streaming

### The Agent Loop

```
1. User sends message
2. Agent receives and processes
3. LLM reasons about response
4. Agent chooses tool(s)
5. Tool executes
6. Result returned to LLM
7. LLM generates response
8. User receives answer
```

**This loop continues across multiple conversation turns, maintaining context!**

---
zoom: 0.9
---
# Key Components Deep Dive

## 1. LLM Agent

#### Core Properties
```typescript
const agent = new LlmAgent({
  name: 'my_agent',           // Unique identifier
  model: 'gemini-2.5-flash', // Gemini model
  instruction: '...',         // System prompt
  tools: [/* tools */],       // Available functions
  // ... callbacks, schemas
});
```

#### Responsibilities
- **Prompt Engineering** - System instructions
- **Tool Orchestration** - Function calling
- **Response Formatting** - Structured outputs
- **Error Handling** - Graceful failures

#### Advanced Features
- **Callbacks** - Intercept requests/responses
- **Output Schema** - Structured JSON responses
- **State Management** - Session persistence
- **Streaming** - Real-time responses

---
zoom: 0.9
---
# Key Components Deep Dive

## Agent Types in ADK

#### LLM-based Agents (use LLM for reasoning)
- **LlmAgent** - Single LLM with tools for decision making
- **SequentialAgent** - Chain agents where output becomes input
- **ParallelAgent** - Run multiple agents concurrently
- **LoopAgent** - Iterative execution until condition met

#### Workflow Agents (deterministic flows)
- **Sequential** - A → B → C (pipeline)
- **Parallel** - A + B + C (concurrent)
- **Loop** - Repeat until done

#### Custom Agents (your own logic)
- Full control over agent behavior
- Implement custom decision algorithms

**Choose the right agent type based on your use case!**

---
zoom: 0.9
---

# Key Components Deep Dive

## 2. Function Tools

#### Tool Definition
```typescript
const myTool = new FunctionTool({
  name: 'calculate_sum',
  description: 'Add two numbers',
  parameters: z.object({
    a: z.number(),
    b: z.number()
  }),
  execute: async ({a, b}) => {
    return { result: a + b };
  }
});
```

#### Best Practices
- **Clear naming** - `action_noun` format
- **Comprehensive descriptions** - What & why
- **Zod validation** - Type safety
- **Error handling** - Graceful failures

---
zoom: 0.9
---

# Key Components Deep Dive

## 2. Function Tools (continued)

#### Tool Categories
- **Data Processing:** Transform, filter, aggregate
- **API Integration:** External service calls
- **Business Logic:** Domain-specific operations
- **State Management:** Session data operations

#### Execution Context
```typescript
execute: async (args, context) => {
  // Access session state
  const state = context.state;

  // Session info
  const { sessionId, userId } = context.invocationContext;

  // Return results
  return { success: true, data: result };
}
```

---

# Function Calling & Zod

## The Bridge Between AI and Code

### Function Calling Deep Dive

**How does the LLM know which tool to use?**

Tools are described to the LLM with:
- **Clear name and description** (for LLM understanding)
- **Parameter descriptions** (what each parameter does)
- **Expected return format** (what the tool returns)

---
zoom: 0.9
---

# Function Calling & Zod (1b/3)

## Tool Description Format

**Example:** When user asks "Search for TypeScript", LLM chooses `search_web` tool

```typescript
// What the LLM sees:
{
  "name": "search_web",
  "description": "Search for information online",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "The search query to execute"
      },
      "maxResults": {
        "type": "number",
        "description": "Maximum number of results to return"
      }
    }
  }
}
```

---
zoom: 0.75
---

# Function Calling & Zod (2/3)

## Zod Schema Validation

**Zod is a TypeScript-first schema validation library that ensures runtime type safety.**

### Why Zod? The Foundation of Type Safety

```typescript
import { z } from 'zod';

// Define tool parameters with descriptions
const transactionSchema = z.object({
  transactions: z.array(
    z.object({
      date: z.string().describe('Transaction date (YYYY-MM-DD)'),
      description: z.string().describe('Transaction description'),
      amount: z.number().positive().describe('Amount spent'),
      category: z.enum(['groceries', 'dining', 'entertainment', 'utilities', 'transport', 'other'])
        .describe('Expense category')
    })
  ).describe('List of transactions to analyze')
});

// ADK FunctionTool integration
const searchTool = new FunctionTool({
  name: 'search_web',
  description: 'Search for information online',
  parameters: searchSchema,
  execute: async ({ query, maxResults = 5 }) => {
    // Zod automatically validates inputs
    // No need for manual validation!
    return await performSearch(query, maxResults);
  }
});
```

---
zoom: 0.9
---

# Function Calling & Zod (3/3)

## Tool Calling in Action

### The Complete Flow

**Step-by-step process:**

1. **User Query:** "Find information about AI agents"
2. **LLM Reasoning:** "I need to search for this information"
3. **Tool Selection:** Chooses `search_web` tool
4. **Parameter Generation:** Creates `{"query": "AI agents", "maxResults": 5}`
5. **Zod Validation:** Ensures parameters are valid
6. **Tool Execution:** Searches and returns results
7. **Response Generation:** LLM formats results for user

---
zoom: 0.9
---

# Function Calling & Zod (4/3)

## Common Zod Patterns for ADK

**Essential validation patterns you'll use frequently:**

```typescript
// String validation
z.string().min(1).max(100).describe("City name")

// Number validation
z.number().positive().describe("Amount in dollars")

// Enum validation
z.enum(['Celsius', 'Fahrenheit']).describe("Temperature unit")

// Complex objects
z.object({
  name: z.string(),
  age: z.number().int().min(0).max(150)
}).describe("Person information")
```

**Pro tip:** Always add `.describe()` to help the LLM understand parameter purposes!

---

# First Principles of AI Agents

## Core Foundations from Agent Theory

### Agent Definition

**"An agent is anything that can be viewed as perceiving its environment through sensors and acting upon that environment through actuators."**

— Russell & Norvig, AI: A Modern Approach

**Key Components:**
- **Environment** - World the agent interacts with
- **Sensors** - Observe the environment
- **Actuators** - Tools to interact with environment
- **Effectors** - Decision-making "brain"

---
zoom: 0.8
---

# First Principles of AI Agents (1b/2)

## Memory Systems in ADK

**Three Components of Context Management:**

**1. Sessions** (Conversation Management)
- Unique identifiers: `sessionId`, `userId`, `appName`
- Stores conversation history as sequence of events
- Tracks last activity timestamp
- Manages multiple conversations per user

**2. State** (Agent's Scratchpad)
- Temporary storage for conversation-specific data
- Serializable values (basic types, simple collections)
- Available across all agent interactions in session
- Can have lifecycle prefixes for management

**3. Memory** (Long-term Knowledge)
- Persistent user information across sessions
- Historical context and preferences
- Can be stored in external databases

---
zoom: 0.8
---

# First Principles of AI Agents (2/2)

## Tools & Planning

### Tools & Function Calling
**ADK Tool Types:**
- **FunctionTool** - Your custom code wrapped as tools
- **Built-in Tools** - Google Search, etc.
- **AgentTool** - Use agents as tools for other agents
- **MCP Tools** - Third-party tools via Model Context Protocol

### Planning & Reasoning
**Chain-of-Thought Process:**
1. **Understand** user request and context
2. **Reason** about required actions
3. **Select** appropriate tools
4. **Execute** tools with proper parameters
5. **Synthesize** results into coherent response
6. **Maintain** conversation continuity

---
zoom: 0.85
---

# First Principles of AI Agents (3/3)

## Session State in Practice

**Example: Session State Usage**
```typescript
// Initial state when creating session
const session = await runner.sessionService.createSession({
  appName: 'finance_app',
  userId: 'user123',
  initialState: {
    user_budget_limit: 5000,
    preferred_currency: 'USD',
    transaction_history: []
  }
});

// State persists across conversation turns
// Agent can reference {{user_budget_limit}} in instructions
```

**Key Benefits:**
- State is available throughout the entire conversation
- Agents can reference state values in their instructions
- Enables context-aware, personalized interactions

---
zoom: 0.7
---

# Multi-Turn Concepts

## State vs Session vs Memory

| Concept | Scope | Persistence | Use Case |
|---------|-------|-------------|----------|
| **State** | Single session | Session lifetime | Data for this conversation |
| **Session** | One conversation | Session lifetime | Entire conversation context |
| **Memory** | User-level | Across sessions | Long-term user information |

## Common Multi-Turn Patterns

**Pattern 1: Analyze Once, Reference Many**
- Store analysis results in state
- Reuse in subsequent turns without re-processing

**Pattern 2: Progressive Refinement**
- Build up information across multiple turns
- Each turn adds more detail to the state

**Pattern 3: Conversation Phases**
- Track conversation stage (analysis → recommendations → action)
- Agent behavior adapts based on current phase

---

# Design Patterns

## Agent Composition Strategies

### Sequential Pipeline
```
graph TD
    A[User Input] --> B[Extractor Agent]
    B --> C[Analyzer Agent]
    C --> D[Responder Agent]
    D --> E[Final Response]
```
*Use when: Complex multi-step processing needed*

### Parallel Execution
```
graph TD
    A[User Input] --> B[Agent 1]
    A --> C[Agent 2]
    A --> D[Agent 3]
    B --> E[Aggregate Results]
    C --> E
    D --> E
```
*Use when: Multiple perspectives needed simultaneously*

---
zoom: 0.85
---

# Design Patterns (2/3)

## Hierarchical Routing

### Hierarchical Routing
```
graph TD
    A[Main Agent] --> B{Intent Classification}
    B -->|Technical| C[Tech Support]
    B -->|Sales| D[Sales Agent]
    B -->|Billing| E[Billing Agent]
    C --> F[Response]
    D --> F
    E --> F
```
*Use when: Different domains need specialized handling*

---
zoom: 0.75
---

# Design Patterns (3/4)

## Agent-to-Agent Communication

**Using Agents as Tools (AgentTool):**
```typescript
// Create specialized agents
const summarizerAgent = new LlmAgent({
  name: 'summarizer',
  model: 'gemini-2.5-flash',
  instruction: 'Create concise summaries of long text.'
});

// Use one agent as a tool for another
const mainAgent = new LlmAgent({
  name: 'writer',
  model: 'gemini-2.5-flash',
  instruction: 'Write articles and use summarizer when needed.',
  tools: [new AgentTool({ agent: summarizerAgent })] // Agent as tool!
});
```

**Benefits:**
- **Modularity** - Specialized agents for specific tasks
- **Collaboration** - Agents working together
- **Delegation** - Main agent can call expert agents

>> **Important Note:** AgentTool and A2A are not the same thing! AgentTool is used within ADK to make one agent a tool for another agent, while A2A is a separate protocol for communication between remote agents.

---
zoom: 0.9
---

# Design Patterns (4/4)

## Loop Agent Pattern

### Loop Agent
```
graph TD
    A[Problem] --> B[Attempt Solution]
    B --> C{Solved?}
    C -->|No| B
    C -->|Yes| D[Final Answer]
```

**Use when:** Iterative refinement needed

**Common Use Cases:**
- Code generation with validation loops
- Problem-solving with multiple attempts
- Optimization tasks requiring iteration
- Self-correcting workflows

---

# Part 2: Code Implementation

## Basic Agent Setup

#### Step 1: Project Setup

```bash
npm init -y
npm install @google/adk zod
npm install -D typescript @types/node
```

**Alternative with Bun:**
```bash
bun init  # Interactive project setup
bun add @google/adk zod
bun add -d typescript @types/node
```

> **Note:** This demo uses Bun for its built-in `prompt()` function. You can use Node.js with the readline module as shown in the code comments.

---
zoom: 0.64
---

# Basic Agent Setup (2/2)

## Agent Implementation

```typescript
// 1. Import dependencies
import { LlmAgent, InMemoryRunner } from '@google/adk';

// 2. Create basic agent
const basicAgent = new LlmAgent({
  name: 'personal_finance_advisor',
  model: 'gemini-2.5-flash',
  description: 'A helpful finance assistant',
  instruction: `You are a helpful finance assistant.
  Help users with financial questions and calculations.`
});

// 3. Create runner and session
const runner = new InMemoryRunner({
  agent: basicAgent,
  appName: 'finance_app'
});

// For Node.js (alternative to Bun prompt):
// import * as readline from 'node:readline/promises';
// const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// 4. Run conversation loop (using Bun for simplicity)
async function chat() {
  while (true) {
    const userInput = prompt('You: '); // Built-in in Bun!
    // For Node.js: const userInput = await rl.question('You: ');

    if (userInput?.toLowerCase() === 'quit') break;

    // Run agent and stream responses
    for await (const event of runner.runAsync({
      userId: 'user123',
      sessionId: 'session456',
      newMessage: { parts: [{ text: userInput }] }
    })) {
      if (event.content) {
        console.log(`Agent: ${event.content.parts[0].text}`);
      }
    }
  }
}
```

---
zoom: 0.8
---

# Basic Agent Setup (2/2)

## Three Ways to Run Your Agent

#### Interactive CLI (Direct Agent)
```bash
# Run your agent script directly with Bun or Node.js
bunx adk run agent.ts
# or: npx tsx agent.ts
# Interactive chat with the Personal Finance Agent
# Type your questions and get responses
```

#### Custom Multi-turn Demo Script
```bash
# Run your own custom simulation script
bun run simulate-conversation.ts
# or: npx tsx simulate-conversation.ts
# Example: Full conversation simulation with all tools
# Shows session management and context preservation
```

#### Dev UI (Prototyping/Debugging)
```bash
# Install and run ADK devtools web UI
bunx adk web agent.ts
# Opens http://localhost:8000
# Visual interface with event inspection
# Real-time streaming and debugging
```

**Choose the method that best fits your development workflow!**

---

# Demo Preview: Finance Agent

## What We'll Build Together

#### Personal Finance Review Agent Features
- **Transaction Analysis** - Categorize and analyze spending
- **Budget Tracking** - Monitor spending against budget limits
- **Multi-turn Conversations** - Remember context across turns
- **Session State Management** - Store analysis results and preferences
- **Context-Aware Responses** - Reference previous conversation history

#### Tools We'll Implement
- `analyze_transactions` - Process and categorize spending data
- `calculate_budget_status` - Check budget compliance percentages
- `set_budget_goal` - Create and store spending limits
- `generate_spending_report` - Create insights and recommendations

---
zoom: 0.75
---

# Demo Preview: Finance Agent (2/4)

## Live Demo: Turns 1-2 (Analysis & Memory)

**Turn 1:** *"Analyze these 5 transactions across categories"*
- Agent calls `analyze_transactions` tool
- **Stores $460 total spending** in session state
- **Categorizes:** Groceries $150, Utilities $120, Dining $85, etc.
- **State stored for future reference**

**Turn 2:** *"Which category did I spend most in?"*
- Agent **references stored analysis** (no re-processing!)
- **Answers:** "Groceries at $150.00" from memory
- Demonstrates **session continuity**
- **No redundant tool calls**

**Key Demonstration:**
- Session state persists between turns
- Agent remembers previous analysis
- Efficient: No re-processing of data

---
zoom: 0.8
---

# Demo Preview: Finance Agent (3/4)

## Live Demo: Turns 3-4 (Budget Management)

**Turn 3:** *"Set a $200 dining budget"*
- Agent calls `set_budget_goal` tool
- **Stores budget** in session state permanently
- Confirms: "This will be remembered in our conversation"
- **Budget persisted in state**

**Turn 4:** *"Check dining budget with $85 spent"*
- Agent uses **stored $200 budget**
- Calls `calculate_budget_status` tool
- **Reports:** "42.5% used, $115 remaining, on track"
- **References stored budget automatically**

**Key Demonstration:**
- State management across multiple turns
- Tools work together using shared state
- Context-aware decision making

---
zoom: 0.8
---

# Demo Preview: Finance Agent (4/4)

## Live Demo: Turn 5 & Summary

**Turn 5:** *"Generate spending report"*
- Agent **synthesizes all session data**
- Calls `generate_spending_report` tool
- **Produces formatted markdown report** with recommendations
- **Uses all accumulated state**

**What This Demo Proves:**

- **Session persistence** - Analysis remembered across 5 turns  
- **Context awareness** - References previous tool results  
- **State management** - Budgets stored and retrieved  
- **Tool orchestration** - 4 different tools working together  
- **Streaming responses** - Real-time text generation with SSE

**The agent maintains perfect context throughout the entire conversation!**

---
zoom: 0.8
---

# Development Best Practices

## Building Robust AI Agents

### **Multi-Turn Conversation Principles**
- **Session state management:** Store and reference conversation context
- **Context-aware tools:** Design tools that work with session history
- **State persistence:** Important data survives across conversation turns
- **Conversation flow:** Natural progression of related topics

**Key Guidelines:**
- Tell agents to remember previous analysis
- Store only data that will be reused
- Use meaningful state keys
- Validate state before using it

---
zoom: 0.75
---

# Development Best Practices (2/3)

## Error Handling & Validation

### **Proper Error Handling Pattern**
```typescript
// Good: Proper error handling
execute: ({ transactions }) => {
  try {
    if (!transactions || transactions.length === 0) {
      return {
        status: 'error',
        message: 'No transactions provided for analysis'
      };
    }

    // Validate transaction data
    const invalidTx = transactions.find(tx => tx.amount <= 0);
    if (invalidTx) {
      return {
        status: 'error',
        message: 'All transaction amounts must be positive'
      };
    }

    // Process transactions...
    return { status: 'success', analysis: result };
  } catch (error) {
    return {
      status: 'error',
      message: `Transaction analysis failed: ${error.message}`
    };
  }
}
```

---
zoom: 0.9
---

# Development Best Practices (3/3)

## Testing & Common Pitfalls

### **Testing Strategies**
- **Test tools independently** before integrating
- **Use descriptive agent instructions** for better reasoning
- **Validate tool outputs** before passing to next tool
- **Monitor token usage** and performance

### **Common Pitfalls to Avoid**
- **Overly complex tools** - Keep them focused and simple
- **Hardcoded secrets** - Use environment variables
- **Inconsistent error formats** - Standardize error responses
- **Missing parameter validation** - Always use Zod schemas

**Remember:** Start simple, test thoroughly, and iterate based on real usage!

---

# Part 3: Advanced ADK Capabilities

## Deep Dive into Production Features

**What's Next:**
- Callbacks & Plugins
- Artifacts & Memory Services
- Advanced Agent Patterns
- Enterprise Integration (MCP, A2A, Grounding)
- Production Configuration

---
src: ./pages/ADK_ADVANCED_CAPABILITIES.md
---

---
src: ./pages/STREAMING_GUIDE.md
---

---

# Q&A & Next Steps

## Questions & Discussion

### Questions?

**We're here to help! Ask about:**
- ADK concepts and implementation
- Tool development challenges
- Agent debugging techniques
- Best practices and patterns

---

# Next Steps & Resources

## **Continue Your AI Agent Journey**

### **Immediate Next Steps:**
1. **Install ADK dependencies** - Add `@google/adk` and `@google/adk-devtools`
2. **Set up Gemini API key** - Get your API key from Google AI Studio
3. **Run the Dev UI** - `npx @google/adk-devtools web` for visual prototyping
4. **Build your first agent** - Start with the finance assistant example
5. **Add custom tools** - Extend agent capabilities with your functions
6. **Experiment with multi-turn** - Test conversation continuity

### **ADK Development Workflow:**

**Development Tools:**
- **Dev UI:** `npx @google/adk-devtools web` (localhost:8000)
  - Visual chat interface for testing agents
  - Real-time event streaming and inspection
  - Debug tool calling and responses
- **CLI Runner:** `npx ts-node your-agent.ts` for command-line testing
- **Event Inspection:** See every step of agent reasoning

**Built-in Tools Available:**
- **Google Search** - Web search capabilities
- **MCP Servers** - Third-party tool integrations
- **A2A Protocol** - Agent-to-agent communication

### **Essential Resources:**
- **[ADK Documentation](https://google.github.io/adk-docs/)** - Complete API reference
- **[ADK GitHub](https://github.com/google/adk-js)** - Source code and examples
- **[Gemini API](https://ai.google.dev/)** - AI model documentation
- **[Zod Documentation](https://zod.dev/)** - Schema validation guide
- **[DevTools Guide](https://google.github.io/adk-docs/devtools/)** - Development workflow

### **Advanced Topics to Explore:**
- **Complex session state** - Managing rich conversation contexts
- **Event-driven architectures** - Advanced conversation patterns
- **State synchronization** - Managing concurrent conversations
- **Production deployment** - Scaling multi-turn applications

---

# Thank You!

## **You've learned the foundation of AI agent development!**

**Key takeaways:**
- ADK enables powerful AI agent creation
- Tools extend agent capabilities
- Zod ensures type safety and validation
- Multi-tool agents enable complex workflows
- Developer experience is excellent

**Ready to build your own AI agents?** The foundation is now yours!

*Connect with us for questions and share your agent creations!*

---

---
layout: statement
---

# Get Started with ADK

## Ready to Build AI Agents?

[Explore the Documentation](https://github.com/google/adk-js) • [Join the Community](https://github.com/google/adk-js)


