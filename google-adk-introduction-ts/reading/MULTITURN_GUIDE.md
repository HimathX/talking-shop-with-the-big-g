# Building Multi-Turn Agents with ADK - Complete Guide

## Table of Contents

1. [What is a Multi-Turn Agent?](#what-is-a-multi-turn-agent)
2. [ADK Primitives for Multi-Turn](#adk-primitives-for-multi-turn)
3. [Session Management](#session-management)
4. [State Tracking](#state-tracking)
5. [Context-Aware Tools](#context-aware-tools)
6. [Building Your Own Multi-Turn Agent](#building-your-own-multi-turn-agent)
7. [Best Practices](#best-practices)
8. [Common Patterns](#common-patterns)

---

## What is a Multi-Turn Agent?

A **multi-turn agent** is an AI agent that maintains context and state across multiple conversation turns. Unlike simple chatbots that treat each message independently, multi-turn agents:

- **Remember** what the user has told them
- **Maintain state** across interactions
- **Avoid repetition** by reusing stored data
- **Build context** from conversation history
- **Make intelligent decisions** based on prior interactions

### Example: Single-Turn vs Multi-Turn

**Single-Turn (Chatbot)**
```
User: "Analyze my spending"
Bot: "I need your transaction data"
User: "Here's my data..."
Bot: [Analyzes]
User: "What about my budget?"
Bot: "I need your transaction data again"  ← Repetition!
```

**Multi-Turn (Agent)**
```
User: "Analyze my spending"
Agent: [Analyzes and stores results]
User: "What about my budget?"
Agent: [References stored analysis] ← No repetition!
```

---

## ADK Primitives for Multi-Turn

ADK provides several key primitives that enable multi-turn conversations:

### 1. **Sessions**
A session represents a single conversation between a user and an agent. Each session has:
- **Unique ID**: Identifies the conversation
- **History**: All events in the conversation
- **State**: Data that persists across turns
- **Metadata**: Creation time, user info, etc.

```typescript
// Sessions are created automatically when a conversation starts
// They persist for the lifetime of the conversation
const session = await agent.createSession();
```

### 2. **Events**
Events are the atomic units of communication in a session. Types include:
- **User Messages**: What the user says
- **Tool Calls**: When the agent uses tools
- **Tool Results**: Results from tool execution
- **Agent Responses**: What the agent says back

```typescript
// Events are created automatically and form conversation history
// You can access them to understand what happened
const events = session.getEvents();
```

### 3. **State**
State is data that persists within a session. It's stored and accessible across turns:
- **Session State**: Data specific to this conversation
- **User State**: Data about the user (across sessions)
- **Agent State**: Internal agent data

```typescript
// Store data in session state
session.state.set('transactionAnalysis', analysisResults);

// Retrieve data in later turns
const analysis = session.state.get('transactionAnalysis');
```

### 4. **Callbacks**
Callbacks are functions that run at specific points in the agent lifecycle:
- **Before tool execution**: Validate or modify tool calls
- **After tool execution**: Process results or update state
- **On agent response**: Log or transform responses

```typescript
// Callbacks allow you to hook into the agent lifecycle
agent.onToolCall((tool, params) => {
  console.log(`Tool called: ${tool.name}`);
});
```

---

## Session Management

### Creating and Managing Sessions

Sessions are typically created automatically by ADK, but you can manage them explicitly:

```typescript
import { Session } from '@google/adk';

// Create a new session
const session = new Session({
  userId: 'user123',
  metadata: {
    source: 'web',
    startTime: new Date(),
  }
});

// Access session properties
console.log(session.id);           // Unique session ID
console.log(session.userId);       // User who owns this session
console.log(session.createdAt);    // When session was created

// Get all events in the session
const events = session.getEvents();

// Get session state
const state = session.getState();
```

### Session Lifecycle

```
1. Session Created
   ↓
2. User sends message
   ↓
3. Agent processes (may call tools)
   ↓
4. Agent responds
   ↓
5. Event added to session
   ↓
6. State updated (if needed)
   ↓
7. Repeat from step 2 or end session
```

### Persisting Sessions

By default, sessions exist only in memory. To persist them:

```typescript
// Save session to database
await sessionService.save(session);

// Retrieve session later
const savedSession = await sessionService.load(sessionId);

// Continue conversation in saved session
const response = await agent.run(userMessage, savedSession);
```

---

## State Tracking

### What to Store in State

Store data that:
- Is **specific to this conversation**
- Will be **referenced in future turns**
- Should **persist** across turns

Examples:
- Analysis results
- User preferences
- Budget goals
- Previous recommendations

### How to Store State

```typescript
// Define state structure
interface ConversationState {
  transactionAnalysis: TransactionAnalysis | null;
  budgetGoals: BudgetGoal[];
  conversationSummary: string[];
}

// Initialize state
const state = session.getState() as ConversationState;
state.transactionAnalysis = analysisResults;
state.budgetGoals = [];
state.conversationSummary = [];

// Update state
state.budgetGoals.push({
  category: 'groceries',
  limit: 300,
  setAt: new Date().toISOString(),
});

// Retrieve state in later turns
const previousAnalysis = state.transactionAnalysis;
if (previousAnalysis) {
  // Use stored analysis instead of re-analyzing
}
```

### State vs Session vs Memory

| Concept | Scope | Persistence | Use Case |
|---------|-------|-------------|----------|
| **State** | Single session | Session lifetime | Data for this conversation |
| **Session** | One conversation | Session lifetime | Entire conversation context |
| **Memory** | User-level | Across sessions | Long-term user information |

---

## Context-Aware Tools

Tools become more powerful when they're aware of session context. They can:
- Reference previous results
- Avoid redundant work
- Make smarter decisions

### Example: Context-Aware Tool

```typescript
// Without context awareness
const analyzeTransactionsTool = new FunctionTool({
  name: 'analyze_transactions',
  description: 'Analyze transactions',
  parameters: z.object({
    transactions: z.array(z.object({ /* ... */ }))
  }),
  execute: ({ transactions }) => {
    // Always analyzes fresh, even if we already did this
    return performAnalysis(transactions);
  }
});

// With context awareness
const analyzeTransactionsTool = new FunctionTool({
  name: 'analyze_transactions',
  description: 'Analyze transactions (uses cached results if available)',
  parameters: z.object({
    transactions: z.array(z.object({ /* ... */ }))
  }),
  execute: ({ transactions }, context) => {
    // Check if we already analyzed this data
    const cached = context.session.state.get('transactionAnalysis');
    if (cached && cached.timestamp === getDataHash(transactions)) {
      return cached; // Reuse cached result
    }
    
    // Otherwise, analyze fresh
    const analysis = performAnalysis(transactions);
    context.session.state.set('transactionAnalysis', analysis);
    return analysis;
  }
});
```

### Passing Context to Tools

Tools can access session context through the execution context:

```typescript
execute: (params, context) => {
  // Access session
  const session = context.session;
  
  // Access session state
  const state = session.getState();
  
  // Access user info
  const userId = session.userId;
  
  // Access conversation history
  const events = session.getEvents();
  
  // Make decisions based on context
  if (state.transactionAnalysis) {
    // We've already analyzed, use stored result
  }
}
```

---

## Building Your Own Multi-Turn Agent

### Step 1: Define Session State

```typescript
interface MySessionState {
  analysisResults: AnalysisResult | null;
  userPreferences: UserPreferences;
  conversationPhase: 'initial' | 'analysis' | 'recommendations' | 'action';
  previousRecommendations: string[];
}
```

### Step 2: Create Context-Aware Tools

```typescript
const myTool = new FunctionTool({
  name: 'my_tool',
  description: 'Does something useful',
  parameters: z.object({ /* ... */ }),
  execute: (params, context) => {
    const state = context.session.getState() as MySessionState;
    
    // Use state to make smart decisions
    if (state.analysisResults) {
      // Build on previous analysis
    }
    
    // Update state for next turn
    state.analysisResults = newResults;
    
    return result;
  }
});
```

### Step 3: Write Agent Instructions for Multi-Turn

```typescript
const agent = new LlmAgent({
  name: 'my_agent',
  model: 'gemini-2.5-flash',
  description: 'My multi-turn agent',
  instruction: `You are a helpful agent. Important behaviors:

1. When you analyze something for the first time, remember the results
2. In future turns, reference your previous analysis instead of asking for data again
3. Build on prior insights - "Earlier we found X, now let's look at Y"
4. Avoid repetition - if you already analyzed something, reference that
5. Maintain continuity - make the conversation feel natural and continuous

This creates a better user experience and makes you seem more intelligent.`,
  tools: [myTool]
});
```

### Step 4: Test Multi-Turn Behavior

```typescript
// Turn 1: Initial request
let response1 = await agent.run('Analyze my data', session);
console.log(response1);

// Turn 2: Follow-up (agent should reference Turn 1)
let response2 = await agent.run('What about X?', session);
console.log(response2);

// Turn 3: Another follow-up (agent should use stored state)
let response3 = await agent.run('Tell me about Y', session);
console.log(response3);
```

---

## Best Practices

### 1. **Be Explicit in Instructions**

Tell the agent to maintain context:

```typescript
instruction: `Remember what you've already analyzed. 
             Don't ask for the same data twice.
             Build on previous insights.`
```

### 2. **Store Strategically**

Only store data that will be reused:

```typescript
// ✅ Good: Store analysis results
state.analysisResults = results;

// ❌ Bad: Store every intermediate calculation
state.intermediateCalc1 = value1;
state.intermediateCalc2 = value2;
```

### 3. **Use Meaningful State Keys**

```typescript
// ✅ Good: Clear, descriptive keys
state.transactionAnalysis = results;
state.budgetGoals = goals;

// ❌ Bad: Unclear keys
state.data1 = results;
state.temp = goals;
```

### 4. **Validate State**

```typescript
const state = session.getState();
if (!state.transactionAnalysis) {
  return { error: 'Please analyze transactions first' };
}
```

### 5. **Log State Changes**

```typescript
// Before update
const before = JSON.stringify(state);

// Make changes
state.budgetGoals.push(newGoal);

// After update
const after = JSON.stringify(state);
console.log(`State changed: ${before} → ${after}`);
```

---

## Common Patterns

### Pattern 1: Analyze Once, Reference Many Times

```typescript
// Turn 1: Analyze
const analysis = await tool.analyze(data);
session.state.set('analysis', analysis);

// Turn 2: Reference
const stored = session.state.get('analysis');
// Use stored analysis without re-analyzing
```

### Pattern 2: Progressive Refinement

```typescript
// Turn 1: Get basic info
state.basicInfo = getBasicInfo();

// Turn 2: Add more detail
state.detailedInfo = getDetailedInfo(state.basicInfo);

// Turn 3: Generate recommendations
state.recommendations = generateRecommendations(state.detailedInfo);
```

### Pattern 3: User Preferences

```typescript
// Turn 1: User sets preferences
state.preferences = { budget: 500, category: 'groceries' };

// Turn 2: Use preferences
const recommendations = getRecommendations(state.preferences);

// Turn 3: Update preferences
state.preferences.budget = 600;
```

### Pattern 4: Conversation Phases

```typescript
// Track where we are in the conversation
state.phase = 'analysis'; // Initial analysis

// Turn 2: Move to next phase
state.phase = 'recommendations';

// Turn 3: Final phase
state.phase = 'action_planning';

// Agent behaves differently based on phase
if (state.phase === 'analysis') {
  // Focus on understanding the problem
} else if (state.phase === 'recommendations') {
  // Focus on providing solutions
}
```

---

## Troubleshooting

### Issue: Agent Keeps Asking for Data Again

**Problem**: Agent doesn't remember previous input

**Solution**: 
- Check that state is being stored: `session.state.set(...)`
- Verify agent instructions mention remembering context
- Ensure session persists across turns

```typescript
// ✅ Correct: Store data
execute: (params) => {
  const result = analyze(params);
  session.state.set('analysis', result);
  return result;
}

// ❌ Wrong: Don't store data
execute: (params) => {
  return analyze(params); // Lost after this turn!
}
```

### Issue: State Gets Lost Between Turns

**Problem**: Session state is empty in later turns

**Solution**:
- Ensure you're using the same session object
- Check that session is persisted if using database
- Verify state is being set before returning from tool

```typescript
// ✅ Correct: Same session across turns
const session = createSession();
await agent.run(msg1, session); // Turn 1
await agent.run(msg2, session); // Turn 2 - same session

// ❌ Wrong: Different sessions
const session1 = createSession();
await agent.run(msg1, session1); // Turn 1

const session2 = createSession(); // New session!
await agent.run(msg2, session2); // Turn 2 - lost context
```

### Issue: Agent Makes Wrong Decisions

**Problem**: Agent doesn't use stored context properly

**Solution**:
- Improve agent instructions
- Make context more explicit in tool descriptions
- Add callbacks to log what agent is doing

```typescript
// Better instructions
instruction: `You have access to previous analysis results.
             Always check if you've already analyzed this data.
             Reference previous results to avoid repetition.
             Build on prior insights in your recommendations.`
```

---

## Summary

Multi-turn agents are the foundation of intelligent, user-friendly AI systems. By mastering **sessions**, **state**, and **context-aware tools**, you can build agents that:

- Feel intelligent and responsive
- Avoid frustrating repetition
- Maintain conversation continuity
- Scale efficiently
- Provide better user experiences

The Personal Finance Agent example demonstrates all these concepts in a practical, easy-to-understand way.

---

## Next Steps

1. **Run the demo**: Try the multi-turn conversation in `MULTITURN_DEMO.md`
2. **Study the code**: Review `agent.ts` to see implementation details
3. **Extend it**: Add new tools that reference session state
4. **Build your own**: Create a multi-turn agent for your use case
5. **Deploy**: Learn how to persist sessions in production

---

## Resources

- [ADK Documentation](https://google.github.io/adk-docs/)
- [Sessions & State](https://google.github.io/adk-docs/build-your-agent/sessions-state/)
- [Events](https://google.github.io/adk-docs/technical-overview/events/)
- [Callbacks](https://google.github.io/adk-docs/build-your-agent/callbacks/)
