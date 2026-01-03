# Multi-Turn Agent Exercises - Personal Finance Agent

## Overview

These exercises build on the Personal Finance Agent to deepen your understanding of multi-turn conversations, session management, and context-aware tools.

---

## Exercise 1: Add a Savings Tracker Tool (15 minutes)

### Objective
Create a tool that tracks savings progress across multiple turns.

### Concept
Multi-turn agents should remember goals and track progress. This exercise teaches you how to:
- Store goals in session state
- Reference goals in future turns
- Calculate progress based on stored data

### Task

Create a `track_savings_progress` tool that:
1. Takes a target savings goal (e.g., "Save $500 this month")
2. Takes current savings amount
3. Calculates progress percentage
4. **Stores the goal in session state**
5. References the stored goal in future turns

### Starter Code

```typescript
const trackSavingsProgressTool = new FunctionTool({
  name: 'track_savings_progress',
  description: 'Track savings progress toward a goal',
  parameters: z.object({
    goal_amount: z.number().positive().describe('Target savings amount'),
    current_savings: z.number().nonnegative().describe('Current savings amount'),
    goal_name: z.string().describe('Name of this savings goal'),
  }),
  execute: ({ goal_amount, current_savings, goal_name }, context) => {
    // TODO: Calculate progress percentage
    // TODO: Store goal in session state
    // TODO: Return progress information
    
    return {
      status: 'success',
      // TODO: Add result fields
    };
  },
});
```

### Solution

```typescript
const trackSavingsProgressTool = new FunctionTool({
  name: 'track_savings_progress',
  description: 'Track savings progress toward a goal. Remembers goals across turns.',
  parameters: z.object({
    goal_amount: z.number().positive().describe('Target savings amount'),
    current_savings: z.number().nonnegative().describe('Current savings amount'),
    goal_name: z.string().describe('Name of this savings goal'),
  }),
  execute: ({ goal_amount, current_savings, goal_name }, context) => {
    const progressPercentage = (current_savings / goal_amount) * 100;
    const remaining = goal_amount - current_savings;

    // Store goal in session state
    const state = context.session.getState();
    if (!state.savingsGoals) {
      state.savingsGoals = [];
    }
    
    const goal = {
      name: goal_name,
      target: goal_amount,
      current: current_savings,
      createdAt: new Date().toISOString(),
    };
    
    state.savingsGoals.push(goal);

    return {
      status: 'success',
      goal_name,
      goal_amount,
      current_savings,
      progress_percentage: parseFloat(progressPercentage.toFixed(1)),
      remaining: parseFloat(remaining.toFixed(2)),
      status_message: progressPercentage >= 100 
        ? `🎉 Goal achieved! You've saved $${current_savings.toFixed(2)}`
        : `${progressPercentage.toFixed(0)}% complete. $${remaining.toFixed(2)} to go`,
    };
  },
});
```

### Testing

Add this tool to the agent and test:

```
Turn 1: "I want to save $500 for a vacation"
Agent: [Stores goal in session]

Turn 2: "I've saved $150 so far"
Agent: [References stored goal, shows progress]

Turn 3: "How's my vacation fund?"
Agent: [Recalls goal from session without re-entering it]
```

### Key Concepts
- Storing goals in session state
- Referencing stored data in future turns
- Avoiding re-entry of same information

---

## Exercise 2: Implement a Comparison Tool (20 minutes)

### Objective
Create a tool that compares current month to previous month using stored data.

### Concept
Multi-turn agents should compare trends. This exercise teaches you how to:
- Store historical data
- Compare current vs previous
- Build insights from comparisons

### Task

Create a `compare_spending_months` tool that:
1. Takes current month spending
2. References previous month from session state
3. Calculates difference and percentage change
4. Provides trend analysis
5. **Stores current month for next month's comparison**

### Starter Code

```typescript
const compareSpendingMonthsTool = new FunctionTool({
  name: 'compare_spending_months',
  description: 'Compare spending between months',
  parameters: z.object({
    current_month: z.string().describe('Current month (YYYY-MM)'),
    current_spending: z.number().positive().describe('Total spending this month'),
  }),
  execute: ({ current_month, current_spending }, context) => {
    // TODO: Get previous month data from session
    // TODO: Calculate difference
    // TODO: Store current month for next comparison
    // TODO: Return comparison results
    
    return {
      status: 'success',
      // TODO: Add result fields
    };
  },
});
```

### Solution

```typescript
const compareSpendingMonthsTool = new FunctionTool({
  name: 'compare_spending_months',
  description: 'Compare spending between months and track trends',
  parameters: z.object({
    current_month: z.string().describe('Current month (YYYY-MM)'),
    current_spending: z.number().positive().describe('Total spending this month'),
  }),
  execute: ({ current_month, current_spending }, context) => {
    const state = context.session.getState();
    
    // Initialize spending history if needed
    if (!state.monthlySpending) {
      state.monthlySpending = {};
    }

    // Get previous month data
    const monthKeys = Object.keys(state.monthlySpending).sort();
    const previousMonth = monthKeys[monthKeys.length - 1];
    const previousSpending = previousMonth ? state.monthlySpending[previousMonth] : null;

    // Calculate comparison
    let comparison = null;
    if (previousSpending) {
      const difference = current_spending - previousSpending;
      const percentChange = (difference / previousSpending) * 100;
      
      comparison = {
        previous_month: previousMonth,
        previous_spending: previousSpending,
        difference: parseFloat(difference.toFixed(2)),
        percent_change: parseFloat(percentChange.toFixed(1)),
        trend: difference > 0 ? 'increased' : difference < 0 ? 'decreased' : 'same',
      };
    }

    // Store current month for next comparison
    state.monthlySpending[current_month] = current_spending;

    return {
      status: 'success',
      current_month,
      current_spending,
      comparison,
      message: comparison
        ? `Your spending ${comparison.trend} by ${Math.abs(comparison.percent_change)}% compared to ${comparison.previous_month}`
        : `This is your first month tracked. Next month we can compare trends!`,
    };
  },
});
```

### Testing

```
Turn 1: "My spending for November was $500"
Agent: [Stores November data]

Turn 2: "December I spent $550"
Agent: [Compares to November, shows 10% increase]

Turn 3: "How's my spending trend?"
Agent: [References stored monthly data]
```

### Key Concepts
- Storing historical data
- Comparing current vs previous
- Building trend analysis
- Multi-month context

---

## Exercise 3: Add Spending Alerts (25 minutes)

### Objective
Create a tool that alerts users when they're approaching budget limits.

### Concept
Context-aware tools should make intelligent decisions. This exercise teaches you how to:
- Check current state against thresholds
- Provide proactive alerts
- Reference multiple data points

### Task

Create a `check_budget_alerts` tool that:
1. References stored budget goals from earlier turns
2. References current spending
3. Checks if spending is approaching limits (80%+)
4. Returns alerts for categories that need attention
5. **Provides actionable recommendations**

### Starter Code

```typescript
const checkBudgetAlertsTool = new FunctionTool({
  name: 'check_budget_alerts',
  description: 'Check for budget alerts based on stored goals and current spending',
  parameters: z.object({
    current_spending: z.record(z.number()).describe('Current spending by category'),
  }),
  execute: ({ current_spending }, context) => {
    const state = context.session.getState();
    
    // TODO: Get budget goals from session
    // TODO: Compare against current spending
    // TODO: Generate alerts for categories over 80%
    // TODO: Provide recommendations
    
    return {
      status: 'success',
      // TODO: Add result fields
    };
  },
});
```

### Solution

```typescript
const checkBudgetAlertsTool = new FunctionTool({
  name: 'check_budget_alerts',
  description: 'Check for budget alerts based on stored goals',
  parameters: z.object({
    current_spending: z.record(z.number()).describe('Current spending by category'),
  }),
  execute: ({ current_spending }, context) => {
    const state = context.session.getState();
    const budgetGoals = state.budgetGoals || [];

    const alerts = [];
    const recommendations = [];

    // Check each budget goal
    budgetGoals.forEach((goal) => {
      const spent = current_spending[goal.category] || 0;
      const percentageUsed = (spent / goal.limit) * 100;

      if (percentageUsed >= 100) {
        alerts.push({
          severity: 'critical',
          category: goal.category,
          message: `⚠️ CRITICAL: Over budget by $${(spent - goal.limit).toFixed(2)}`,
          percentage: percentageUsed,
        });
        recommendations.push(
          `Immediately reduce ${goal.category} spending to get back under budget`
        );
      } else if (percentageUsed >= 80) {
        alerts.push({
          severity: 'warning',
          category: goal.category,
          message: `⚠️ WARNING: ${percentageUsed.toFixed(0)}% of budget used`,
          percentage: percentageUsed,
        });
        recommendations.push(
          `Slow down on ${goal.category} spending - only $${(goal.limit - spent).toFixed(2)} remaining`
        );
      }
    });

    return {
      status: 'success',
      alert_count: alerts.length,
      alerts,
      recommendations,
      summary: alerts.length === 0
        ? '✓ All budgets are on track!'
        : `⚠️ ${alerts.length} budget alert(s) require attention`,
    };
  },
});
```

### Testing

```
Turn 1: "Set budget: $300 groceries, $100 dining"
Agent: [Stores budgets]

Turn 2: "My spending: groceries $280, dining $95"
Agent: [Checks alerts, shows warnings]

Turn 3: "Check my budget status"
Agent: [Recalls budgets from Turn 1, checks against spending]
```

### Key Concepts
- Referencing multiple stored data points
- Making intelligent decisions based on context
- Providing proactive alerts
- Context-aware recommendations

---

## Exercise 4: Build a Conversation Summarizer (20 minutes)

### Objective
Create a tool that summarizes the entire conversation history.

### Concept
Multi-turn agents should track conversation progress. This exercise teaches you how to:
- Access conversation history
- Summarize key points
- Reference what's been discussed

### Task

Create a `summarize_conversation` tool that:
1. Accesses session events/history
2. Extracts key decisions and data points
3. Summarizes what's been discussed
4. Lists remaining action items
5. **Stores summary in session for reference**

### Starter Code

```typescript
const summarizeConversationTool = new FunctionTool({
  name: 'summarize_conversation',
  description: 'Summarize the conversation so far',
  parameters: z.object({
    // No parameters needed - uses session history
  }),
  execute: ({}, context) => {
    const state = context.session.getState();
    
    // TODO: Build summary from session state
    // TODO: List key decisions
    // TODO: Identify action items
    // TODO: Store summary
    
    return {
      status: 'success',
      // TODO: Add result fields
    };
  },
});
```

### Solution

```typescript
const summarizeConversationTool = new FunctionTool({
  name: 'summarize_conversation',
  description: 'Summarize the conversation and key decisions',
  parameters: z.object({}),
  execute: ({}, context) => {
    const state = context.session.getState();

    const summary = {
      analysis: state.transactionAnalysis ? 'Completed' : 'Not yet',
      budgets_set: (state.budgetGoals || []).length,
      savings_goals: (state.savingsGoals || []).length,
      key_findings: [],
      action_items: [],
    };

    // Extract key findings
    if (state.transactionAnalysis) {
      summary.key_findings.push(
        `Top spending category: ${state.transactionAnalysis.topCategory.name} at $${state.transactionAnalysis.topCategory.amount}`
      );
      summary.key_findings.push(
        `Total spending: $${state.transactionAnalysis.totalSpent}`
      );
    }

    // Extract action items
    if (state.budgetGoals && state.budgetGoals.length > 0) {
      summary.action_items.push(
        `Monitor spending against ${state.budgetGoals.length} budget goals`
      );
    }

    if (state.savingsGoals && state.savingsGoals.length > 0) {
      summary.action_items.push(
        `Track progress on ${state.savingsGoals.length} savings goals`
      );
    }

    // Store summary
    state.conversationSummary = summary;

    const report = `
# Conversation Summary

## What We've Discussed
- Transaction Analysis: ${summary.analysis}
- Budget Goals Set: ${summary.budgets_set}
- Savings Goals: ${summary.savings_goals}

## Key Findings
${summary.key_findings.map((f) => `- ${f}`).join('\n')}

## Action Items
${summary.action_items.length > 0 
  ? summary.action_items.map((a) => `- ${a}`).join('\n')
  : '- No immediate action items'}
    `.trim();

    return {
      status: 'success',
      summary,
      report,
    };
  },
});
```

### Testing

```
Turn 1: "Analyze my spending"
Turn 2: "Set budgets"
Turn 3: "Set savings goals"
Turn 4: "Summarize our conversation"
Agent: [Recalls all prior turns and creates comprehensive summary]
```

### Key Concepts
- Accessing session state
- Extracting key information
- Summarizing conversation progress
- Providing comprehensive overview

---

## Challenge: Build a Complete Multi-Turn Scenario

### Objective
Combine all exercises into a realistic multi-turn conversation.

### Scenario
A user goes through a complete financial review process:

1. **Turn 1**: Analyze December spending
2. **Turn 2**: Set budget goals
3. **Turn 3**: Set savings goals
4. **Turn 4**: Check budget alerts
5. **Turn 5**: Compare to previous month
6. **Turn 6**: Ask follow-up questions (agent recalls everything)
7. **Turn 7**: Summarize the entire conversation

### Requirements
- Agent maintains context across all 7 turns
- No data is repeated or re-entered
- Each turn builds on previous turns
- Agent demonstrates understanding of full conversation

### Testing

Run through the complete scenario and verify:
- ✅ Agent remembers all previous inputs
- ✅ Agent doesn't ask for data twice
- ✅ Agent builds on prior insights
- ✅ Agent provides coherent summary at the end

---

## Key Concepts Recap

| Concept | Exercise | What You Learned |
|---------|----------|------------------|
| **State Storage** | 1, 2, 4 | How to store data for later use |
| **State Retrieval** | 1, 2, 3, 4 | How to access stored data |
| **Trend Analysis** | 2 | Comparing current vs previous |
| **Proactive Alerts** | 3 | Making intelligent decisions |
| **Conversation History** | 4 | Tracking what's been discussed |
| **Context Awareness** | All | Using context to make smart decisions |

---

## Submission Checklist

For each exercise, verify:
- ✅ Tool code is clean and well-commented
- ✅ Session state is properly stored
- ✅ Tool references previous state appropriately
- ✅ Tool provides meaningful output
- ✅ Multi-turn behavior works correctly
- ✅ No data is lost between turns
- ✅ Agent instructions guide multi-turn behavior

---

## Next Steps

After completing these exercises:

1. **Extend further**: Add more tools that reference session state
2. **Persist sessions**: Save sessions to a database
3. **Add callbacks**: Log state changes and tool calls
4. **Build UI**: Create a web interface for the agent
5. **Deploy**: Put your multi-turn agent into production

---

## Resources

- [MULTITURN_GUIDE.md](MULTITURN_GUIDE.md) - Complete guide to multi-turn agents
- [MULTITURN_DEMO.md](MULTITURN_DEMO.md) - Example conversation
- [agent.ts](agent.ts) - Agent implementation
- [ADK Documentation](https://google.github.io/adk-docs/)
