# Building the Personal Finance Review Agent - Step-by-Step Guide

Welcome to the building guide for the **Personal Finance Review Agent**! This guide is broken into stages. After each stage, you'll have a working piece of code that you can run to see your progress.

The final goal is to build the complete `agent.ts` that powers our multi-turn conversation demo.

---

## 🛠️ Prerequisites: Setup & API Keys

Before we start building, let's make sure your environment is ready.

### 📝 Step 0: Initial Setup
1. **Initialize your project:**
   ```bash
   mkdir finance-agent && cd finance-agent
   npm init -y
   ```
2. **Install dependencies:**
   ```bash
   npm install @google/adk @google/adk-devtools
   npm install -D typescript @types/node ts-node
   ```
3. **Get your Google Gemini API Key:**
   - Go to [Google AI Studio](https://aistudio.google.com/).
   - Click on **"Get API key"** in the sidebar.
   - Create a new API key in a new project.
   - **Important:** Create a `.env` file in your project root and add your key:
     ```
     GOOGLE_GENAI_API_KEY=your_api_key_here
     ```

---

## 🏗️ Stage 1: The Foundation (Skeleton Agent)

In this stage, we set up the basic project structure and define our agent with no tools. This verifies that our environment and API keys are set up correctly.

### 📝 Step 1: Basic Definitions
Create a new file (e.g., `my-agent.ts`) and add the initial imports and the agent skeleton.

```typescript
import { LlmAgent, InMemoryRunner } from '@google/adk';

// 1. Define the Agent
export const personalFinanceAgent = new LlmAgent({
  name: 'personal_finance_advisor',
  model: 'gemini-2.5-flash',
  description: 'A personal finance advisor that analyzes spending.',
  instruction: `You are a helpful personal finance advisor. 
  Your role is to help users manage their spending.`,
});

// 2. Export for ADK tools
export const rootAgent = personalFinanceAgent;
export default personalFinanceAgent;
```

### 🚀 Run it!
Test that your agent can at least talk to you:
```bash
npx @google/adk-devtools run my-agent.ts
```
**Win:** Type "Hello" and see the agent respond. You've just created your first ADK agent! 🎉

---

## 🔧 Stage 2: Adding Your First Tool (Analysis)

Now let's give the agent some real power. We'll add the `analyze_transactions` tool.

### 📝 Step 2: Implement the Analysis Tool
Add this code *before* your agent definition:

```typescript
import { FunctionTool } from '@google/adk';
import { z } from 'zod';

const analyzeTransactionsTool = new FunctionTool({
  name: 'analyze_transactions',
  description: 'Analyze spending transactions and categorize them by type.',
  parameters: z.object({
    transactions: z.array(
      z.object({
        date: z.string(),
        description: z.string(),
        amount: z.number().positive(),
        category: z.enum(['groceries', 'dining', 'entertainment', 'utilities', 'transport', 'other']),
      })
    ),
  }),
  execute: ({ transactions }) => {
    const categories: Record<string, number> = {};
    let totalSpent = 0;
    transactions.forEach(tx => {
      categories[tx.category] = (categories[tx.category] || 0) + tx.amount;
      totalSpent += tx.amount;
    });
    return { status: 'success', totalSpent, categories };
  },
});

// Update your agent to use the tool
// ... in the LlmAgent definition:
// tools: [analyzeTransactionsTool],
```

### 🚀 Run it!
```bash
npx @google/adk-devtools run my-agent.ts
```
**Win:** Paste this: *"Analyze these: grocery $50, dining $30"*. See the agent call the tool and give you a breakdown! 💰

---

## 🧠 Stage 3: Building a Memory System (Budget Goals)

Multi-turn agents need to remember things. Let's add the ability to set budget goals.

### 📝 Step 3: Implement Budget Tools
Add these tools to your script:

```typescript
const setBudgetGoalTool = new FunctionTool({
  name: 'set_budget_goal',
  description: 'Set a budget goal for a spending category.',
  parameters: z.object({
    category: z.string(),
    limit: z.number().positive(),
  }),
  execute: ({ category, limit }) => {
    return { 
      status: 'success', 
      message: `Budget goal set: $${limit} for ${category}. I'll remember this!` 
    };
  },
});

// Update agent tools:
// tools: [analyzeTransactionsTool, setBudgetGoalTool],
```

### 🚀 Run it!
```bash
npx @google/adk-devtools run my-agent.ts
```
**Win:** Tell the agent *"Set a $200 budget for groceries"*. It will confirm it. Because of ADK's session management, it will remember this in the next turn! 🧠

---

## 📊 Stage 4: Advanced Logic (Budget Status)

Now let's add logic to compare spending against those goals.

### 📝 Step 4: Implement Status Calculation
Add the `calculate_budget_status` tool:

```typescript
const calculateBudgetStatusTool = new FunctionTool({
  name: 'calculate_budget_status',
  description: 'Calculate how much of a budget has been used.',
  parameters: z.object({
    category: z.string(),
    spent: z.number(),
    budget_limit: z.number(),
  }),
  execute: ({ category, spent, budget_limit }) => {
    const remaining = budget_limit - spent;
    return { 
      status: 'success', 
      percentage_used: (spent / budget_limit) * 100,
      remaining
    };
  },
});

// Update agent tools:
// tools: [analyzeTransactionsTool, setBudgetGoalTool, calculateBudgetStatusTool],
```

### 🚀 Run it!
```bash
npx @google/adk-devtools run my-agent.ts
```
**Win:** You can now ask *"How am I doing against my $200 grocery budget if I spent $150?"*. The agent will use the tool to calculate your status! 📈

---

## 🏆 Stage 5: The Final Polish (Reporting & Instructions)

The final step is to add the reporting tool and refine the agent's instructions so it knows how to handle a multi-turn conversation like a pro.

### 📝 Step 5: Final Full Implementation
Update your `instruction` and add the final `generate_spending_report` tool (check the full `agent.ts` for the complete reporting logic).

**Refined Instructions:**
```typescript
instruction: `You are a helpful personal finance advisor. 
Key behaviors:
1. Remember budget goals set by the user.
2. Reference previous analysis results instead of asking again.
3. Build on previous insights ("Earlier we found X, now let's look at Y").`
```

### 🚀 The "Dopamine Hit" Demo
Run the complete simulation script to see everything working in harmony:
```bash
bun run simulate-conversation.ts
```

**Final Win:** You'll see a 5-turn conversation where the agent analyzes data, remembers a budget, calculates status, and generates a final report—all without repeating itself! 🏆🚀

---

## 🎯 Next Steps
- Try adding more categories to the Zod schema.
- Experiment with `StreamingMode.SSE` for real-time responses.
- Use the **Dev UI** (`npm run web`) to see the event flow visually!
