# Multi-Turn Conversation Demo - Personal Finance Agent

## Overview

This document demonstrates how the Personal Finance Agent maintains context across multiple conversation turns. This is a **key ADK primitive** for building intelligent, stateful agents.

---

## What Makes This Multi-Turn?

Traditional agents treat each message independently. **Multi-turn agents** maintain:
- **Conversation History**: What's been discussed
- **Session State**: Data that persists across turns
- **Context**: Understanding of what happened before
- **Continuity**: Avoiding repetition and building on previous insights

---

## Demo Scenario: December Spending Review

A user reviews their December spending across 4 conversation turns.

---

## Turn 1: Initial Analysis

### User Input
```
"I want to review my December spending. Here are my transactions:
- 12/01: Whole Foods, $85 (groceries)
- 12/03: Chipotle, $15 (dining)
- 12/05: Netflix, $15 (entertainment)
- 12/07: Trader Joe's, $92 (groceries)
- 12/10: Restaurant, $45 (dining)
- 12/12: Movie tickets, $30 (entertainment)
- 12/15: Whole Foods, $78 (groceries)
- 12/18: Coffee shop, $8 (dining)
- 12/20: Concert, $75 (entertainment)
- 12/22: Grocery store, $65 (groceries)"
```

### What Happens (Behind the Scenes)
1. Agent receives transactions
2. Calls `analyze_transactions` tool
3. **Stores results in session state**:
   - Total: $508
   - Groceries: $320 (top category)
   - Dining: $68
   - Entertainment: $120

### Agent Response
```
✓ Analysis Complete!

I've analyzed your 10 December transactions totaling $508.

Here's your spending breakdown:
• Groceries: $320 (63% of total) - Your top spending category
• Entertainment: $120 (24% of total)
• Dining: $68 (13% of total)

Key insight: Groceries account for nearly 2/3 of your spending. 
This is your biggest opportunity for optimization.

What would you like to explore next? I can:
- Set budget goals for specific categories
- Dive deeper into any category
- Compare against recommended budgets
- Create a full spending report
```

### Session State After Turn 1
```json
{
  "transactionAnalysis": {
    "totalSpent": 508,
    "categories": {
      "groceries": 320,
      "dining": 68,
      "entertainment": 120
    },
    "topCategory": { "name": "groceries", "amount": 320 },
    "timestamp": "2024-12-29T..."
  },
  "budgetGoals": [],
  "conversationSummary": [
    "Analyzed 10 transactions for December",
    "Identified groceries as top spending at $320"
  ]
}
```

---

## Turn 2: Budget Setting & Follow-Up

### User Input
```
"That makes sense. Let me set a budget. I want to spend max $300 on 
groceries and $100 on dining. How am I doing against those budgets?"
```

### What Happens (Multi-Turn Magic!)
1. Agent calls `set_budget_goal` for groceries ($300)
2. Agent calls `set_budget_goal` for dining ($100)
3. **Agent references stored analysis** (no re-analysis needed!)
4. Agent calls `calculate_budget_status` for each category
5. **Updates session state** with new budget goals

### Agent Response
```
✓ Budgets Set!

I've saved your budget goals:
• Groceries: $300/month
• Dining: $100/month

Now let's see how you did in December against these targets:

📊 Groceries: $320 spent vs $300 budget
   ❌ Over budget by $20 (107% of budget used)
   
📊 Dining: $68 spent vs $100 budget
   ✓ On track! (68% of budget used)
   Remaining: $32

Key observation: You exceeded your grocery budget by $20, but you're 
doing well with dining. Since we already analyzed your December data, 
I can see exactly where the grocery overage came from if you'd like.
```

### Session State After Turn 2
```json
{
  "transactionAnalysis": {
    "totalSpent": 508,
    "categories": { ... },
    "topCategory": { "name": "groceries", "amount": 320 }
  },
  "budgetGoals": [
    { "category": "groceries", "limit": 300, "setAt": "..." },
    { "category": "dining", "limit": 100, "setAt": "..." }
  ],
  "conversationSummary": [
    "Analyzed 10 transactions for December",
    "Identified groceries as top spending at $320",
    "Set budget goals: groceries $300, dining $100",
    "Identified grocery overage of $20"
  ]
}
```

### Why This Is Multi-Turn
- ✅ Agent referenced previous analysis without re-asking for data
- ✅ Agent stored budget goals for future reference
- ✅ Agent built on prior insights ("we already analyzed your December data")
- ✅ Conversation feels continuous and intelligent

---

## Turn 3: Deeper Analysis

### User Input
```
"I'm surprised about the grocery overage. Can you tell me which 
transactions pushed me over? And what can I do differently?"
```

### What Happens (Pure Multi-Turn)
1. Agent **does NOT call analyze_transactions again**
2. Agent **references stored analysis** from Turn 1
3. Agent **uses stored budget goals** from Turn 2
4. Agent provides insights based on stored data
5. Agent makes recommendations

### Agent Response
```
✓ Grocery Breakdown (from your December data)

Looking at your 4 grocery transactions:
• 12/01: Whole Foods - $85 ⚠️ Premium store
• 12/07: Trader Joe's - $92 ⚠️ Premium store  
• 12/15: Whole Foods - $78 ⚠️ Premium store
• 12/22: Regular grocery - $65 ✓ Standard store

Total: $320 (Budget: $300)

💡 Recommendations to save $20+/month:

1. Reduce premium store visits: You shopped at Whole Foods 3 times 
   and Trader Joe's once. These tend to be 15-20% more expensive.
   
2. Consolidate trips: Instead of 4 trips, try 2-3 bulk shopping trips 
   to a standard grocery store.
   
3. Meal planning: Plan meals before shopping to avoid impulse purchases 
   at premium stores.

If you switch 2 Whole Foods trips to a standard store, you'd save 
~$30-40/month and easily stay under your $300 budget.
```

### Why This Is Multi-Turn
- ✅ Agent recalled specific transactions from Turn 1
- ✅ Agent didn't ask for data again
- ✅ Agent built recommendations on stored analysis
- ✅ Conversation feels like a real advisor who remembers details

---

## Turn 4: Tracking Progress

### User Input
```
"That's helpful! I'll try shopping at regular stores. Let me also 
check on my entertainment spending. What was that again?"
```

### What Happens (Demonstrating Memory)
1. Agent **references stored analysis** from Turn 1
2. Agent **uses stored budgets** (even though user didn't set one for entertainment)
3. Agent provides context without re-analysis

### Agent Response
```
✓ Entertainment Spending

From your December analysis, you spent $120 on entertainment:
• 12/05: Netflix - $15 (subscription)
• 12/12: Movie tickets - $30
• 12/20: Concert - $75

You haven't set a budget for entertainment yet. Would you like to?

Based on your spending pattern, here are some options:
• Conservative: $80/month (would require cutting the concert or movies)
• Moderate: $120/month (matches your December spending)
• Flexible: $150/month (allows for occasional splurges)

The concert was a one-time event ($75), so if that's not typical, 
your regular entertainment is just $45/month (Netflix + occasional movies).

What would you prefer?
```

### Why This Is Multi-Turn
- ✅ Agent recalled entertainment breakdown without asking
- ✅ Agent distinguished between recurring and one-time expenses
- ✅ Agent provided context-aware recommendations
- ✅ Conversation demonstrates true understanding of user's situation

---

## Session State After Turn 4

```json
{
  "transactionAnalysis": {
    "totalSpent": 508,
    "categories": {
      "groceries": 320,
      "dining": 68,
      "entertainment": 120
    },
    "topCategory": { "name": "groceries", "amount": 320 },
    "timestamp": "2024-12-29T..."
  },
  "budgetGoals": [
    { "category": "groceries", "limit": 300 },
    { "category": "dining", "limit": 100 }
  ],
  "conversationSummary": [
    "Analyzed 10 transactions for December",
    "Identified groceries as top spending at $320",
    "Set budget goals: groceries $300, dining $100",
    "Identified grocery overage of $20",
    "Provided grocery optimization recommendations",
    "Discussed entertainment spending ($120 total, $75 one-time event)"
  ]
}
```

---

## Key ADK Primitives Demonstrated

### 1. **Sessions** 
- Each conversation maintains a session
- Session persists across multiple turns
- Session contains conversation history and state

### 2. **State Management**
- Transaction analysis stored and reused
- Budget goals remembered
- Conversation summary maintained
- No data re-entered across turns

### 3. **Events**
- Each turn creates events (user message, tool calls, agent response)
- Events form the conversation history
- Agent can reference events from previous turns

### 4. **Context-Aware Tools**
- Tools reference session state
- Tools don't repeat work already done
- Tools build on previous results

### 5. **Conversation Continuity**
- Agent maintains context
- Agent avoids repetition
- Agent builds on prior insights
- Conversation feels natural and intelligent

---

## Comparison: Single-Turn vs Multi-Turn

### ❌ Single-Turn (Without Session Management)

```
Turn 1: User provides data → Agent analyzes
Turn 2: User asks follow-up → Agent says "What's your data again?"
Turn 3: User repeats data → Agent re-analyzes
Turn 4: User asks another question → Agent says "What's your data?"
```

**Problems**: Repetitive, frustrating, inefficient, not intelligent

### ✅ Multi-Turn (With Session Management)

```
Turn 1: User provides data → Agent analyzes & stores
Turn 2: User asks follow-up → Agent recalls data from session
Turn 3: User asks another question → Agent uses stored analysis
Turn 4: User asks about trends → Agent references all prior context
```

**Benefits**: Natural, efficient, intelligent, user-friendly

---

## How to Try This Demo

### Option 1: Use the Web Interface
```bash
npm install
npm run web
```

Then visit `http://localhost:8000` and:
1. Paste the Turn 1 transactions
2. Ask about budgets (Turn 2)
3. Ask for breakdown (Turn 3)
4. Ask about entertainment (Turn 4)

Watch how the agent maintains context!

### Option 2: Use the CLI Interface
```bash
npm install
npm run dev
```

Then have the same multi-turn conversation in the terminal.

---

## What You're Learning

This demo teaches you how to build agents that:
- **Remember** what users have told them
- **Avoid repetition** by reusing stored data
- **Build context** across multiple interactions
- **Feel intelligent** by understanding conversation flow
- **Scale efficiently** by not re-processing same data

These are the **foundational primitives** that make agents useful in real-world applications.

---

## Next Steps

After understanding this demo:

1. **Extend the agent** with more tools that reference session state
2. **Add persistence** to save sessions between conversations
3. **Implement callbacks** to log what the agent does
4. **Build multi-agent systems** where agents share context
5. **Deploy** to production with proper session management

---

## Key Takeaway

> **Multi-turn conversations are the difference between a chatbot and an intelligent agent.**
> 
> Chatbots respond to each message independently.  
> Agents maintain context, remember history, and build on prior interactions.
> 
> This is what makes agents truly useful.

---

## Resources

- [ADK Sessions Documentation](https://google.github.io/adk-docs/technical-overview/context/)
- [ADK State Management](https://google.github.io/adk-docs/build-your-agent/sessions-state/)
- [ADK Events](https://google.github.io/adk-docs/technical-overview/events/)
