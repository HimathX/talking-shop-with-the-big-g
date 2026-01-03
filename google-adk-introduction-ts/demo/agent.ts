/**
 * Personal Finance Review Agent - Multi-Turn Conversation Example
 * 
 * This agent demonstrates ADK primitives for multi-turn conversations:
 * - Session Management: Maintaining context across turns
 * - State Tracking: Storing analysis results and user preferences
 * - Context-Aware Tools: Tools that reference session history
 * - Conversation History: Using Events to track interactions
 * 
 * Key Learning: How agents maintain continuity and avoid repetition
 */

import { FunctionTool, LlmAgent } from '@google/adk';
import { z } from 'zod';

/**
 * Type definitions for session state
 * This demonstrates how to structure data that persists across turns
 */
interface TransactionAnalysis {
  totalSpent: number;
  categories: Record<string, number>;
  topCategory: { name: string; amount: number };
  timestamp: string;
}

interface BudgetGoal {
  category: string;
  limit: number;
  setAt: string;
}

interface SessionState {
  transactionAnalysis: TransactionAnalysis | null;
  budgetGoals: BudgetGoal[];
  conversationSummary: string[];
}

/**
 * Tool 1: Analyze Transactions
 * 
 * Demonstrates:
 * - Zod schema validation for complex data
 * - Data transformation and categorization
 * - Returning structured analysis
 * 
 * In multi-turn context: Results are stored in session for later reference
 */
const analyzeTransactionsTool = new FunctionTool({
  name: 'analyze_transactions',
  description: 'Analyze spending transactions and categorize them by type. Returns spending summary by category.',
  parameters: z.object({
    transactions: z.array(
      z.object({
        date: z.string().describe('Transaction date (YYYY-MM-DD)'),
        description: z.string().describe('Transaction description'),
        amount: z.number().positive().describe('Amount spent'),
        category: z.enum(['groceries', 'dining', 'entertainment', 'utilities', 'transport', 'other']).describe('Expense category'),
      })
    ).describe('List of transactions to analyze'),
  }),
  execute: ({ transactions }) => {
    // Validate we have transactions
    if (transactions.length === 0) {
      return {
        status: 'error',
        message: 'No transactions provided',
      };
    }

    // Calculate totals by category
    const categories: Record<string, number> = {};
    let totalSpent = 0;

    transactions.forEach((tx) => {
      categories[tx.category] = (categories[tx.category] || 0) + tx.amount;
      totalSpent += tx.amount;
    });

    // Find top category
    const topCategory = Object.entries(categories).reduce((prev, current) =>
      prev[1] > current[1] ? prev : current
    );

    const analysis: TransactionAnalysis = {
      totalSpent,
      categories,
      topCategory: { name: topCategory[0], amount: topCategory[1] },
      timestamp: new Date().toISOString(),
    };

    return {
      status: 'success',
      analysis,
      summary: `Analyzed ${transactions.length} transactions totaling $${totalSpent.toFixed(2)}. 
                Top spending category: ${topCategory[0]} at $${topCategory[1].toFixed(2)}.`,
    };
  },
});

/**
 * Tool 2: Calculate Budget Status
 * 
 * Demonstrates:
 * - Conditional logic in tools
 * - Percentage calculations
 * - Status-based responses
 * 
 * In multi-turn context: References previously set budgets from session
 */
const calculateBudgetStatusTool = new FunctionTool({
  name: 'calculate_budget_status',
  description: 'Calculate how much of a budget has been used for a specific category. Compares actual spending against budget limit.',
  parameters: z.object({
    category: z.string().describe('Spending category'),
    spent: z.number().positive().describe('Amount already spent'),
    budget_limit: z.number().positive().describe('Budget limit for this category'),
  }),
  execute: ({ category, spent, budget_limit }) => {
    const percentageUsed = (spent / budget_limit) * 100;
    const remaining = budget_limit - spent;
    const isOverBudget = spent > budget_limit;

    let status: 'on_track' | 'warning' | 'over_budget';
    if (isOverBudget) {
      status = 'over_budget';
    } else if (percentageUsed > 80) {
      status = 'warning';
    } else {
      status = 'on_track';
    }

    return {
      status: 'success',
      category,
      spent: parseFloat(spent.toFixed(2)),
      budget_limit: parseFloat(budget_limit.toFixed(2)),
      percentage_used: parseFloat(percentageUsed.toFixed(1)),
      remaining: parseFloat(remaining.toFixed(2)),
      budget_status: status,
      message: isOverBudget
        ? `⚠️ Over budget by $${Math.abs(remaining).toFixed(2)}`
        : `✓ ${percentageUsed.toFixed(0)}% of budget used`,
    };
  },
});

/**
 * Tool 3: Set Budget Goal
 * 
 * Demonstrates:
 * - Modifying session state through tools
 * - Storing user preferences
 * - Returning confirmation
 * 
 * In multi-turn context: Updates session state for future turns
 */
const setBudgetGoalTool = new FunctionTool({
  name: 'set_budget_goal',
  description: 'Set or update a budget goal for a spending category. This is remembered across conversation turns.',
  parameters: z.object({
    category: z.string().describe('Spending category'),
    limit: z.number().positive().describe('Budget limit for this category'),
  }),
  execute: ({ category, limit }) => {
    // In a real implementation, this would update the session state
    // For now, we return confirmation that would be stored
    const budgetGoal: BudgetGoal = {
      category,
      limit,
      setAt: new Date().toISOString(),
    };

    return {
      status: 'success',
      budget_goal: budgetGoal,
      message: `Budget goal set: $${limit.toFixed(2)} for ${category}. This will be remembered in our conversation.`,
    };
  },
});

/**
 * Tool 4: Generate Spending Report
 * 
 * Demonstrates:
 * - Formatting complex data into readable output
 * - Combining multiple data sources
 * - Creating actionable insights
 * 
 * In multi-turn context: Can reference previous analyses without re-running them
 */
const generateSpendingReportTool = new FunctionTool({
  name: 'generate_spending_report',
  description: 'Generate a formatted spending report with insights and recommendations based on transaction analysis.',
  parameters: z.object({
    analysis_summary: z.string().describe('Summary of transaction analysis'),
    budget_status: z.array(
      z.object({
        category: z.string(),
        status: z.enum(['on_track', 'warning', 'over_budget']),
        percentage: z.number(),
      })
    ).describe('Budget status for each category'),
    recommendations: z.array(z.string()).describe('List of savings recommendations'),
  }),
  execute: ({ analysis_summary, budget_status, recommendations }) => {
    let report = `# Personal Finance Review Report\n\n`;
    report += `## Summary\n${analysis_summary}\n\n`;

    report += `## Budget Status\n`;
    budget_status.forEach((item) => {
      const icon = item.status === 'on_track' ? '✓' : item.status === 'warning' ? '⚠️' : '❌';
      report += `- ${icon} ${item.category}: ${item.percentage}% of budget used\n`;
    });

    report += `\n## Recommendations\n`;
    recommendations.forEach((rec, i) => {
      report += `${i + 1}. ${rec}\n`;
    });

    report += `\n---\n*Report generated by Personal Finance Review Agent*\n`;

    return {
      status: 'success',
      report,
      report_length: report.length,
    };
  },
});

/**
 * Main Personal Finance Agent
 * 
 * This agent is designed for multi-turn conversations where:
 * 1. User provides transaction data
 * 2. Agent analyzes and stores results
 * 3. User can ask follow-up questions referencing previous analysis
 * 4. Agent maintains context and avoids re-analyzing same data
 * 5. User can set/update budgets that persist across turns
 */
export const personalFinanceAgent = new LlmAgent({
  name: 'personal_finance_advisor',
  model: 'gemini-2.5-flash',
  description: 'A personal finance advisor that analyzes spending and provides insights across multiple conversation turns.',
  instruction: `You are a helpful personal finance advisor. Your role is to help users understand and manage their spending.

Key behaviors for multi-turn conversations:
1. When analyzing transactions for the first time, store the results and refer back to them in future turns
2. Remember budget goals the user sets - don't ask them to re-enter them
3. When asked follow-up questions, reference your previous analysis instead of asking for data again
4. Build on previous insights - "Earlier we found your top spending was X, now let's look at Y"
5. Avoid repetition - if you already analyzed something, reference that analysis

Available tools:
- analyze_transactions: Use this when you first receive spending data
- calculate_budget_status: Use this to check if spending is within budget
- set_budget_goal: Use this when user wants to set or update a budget
- generate_spending_report: Use this to create a formatted report

Example multi-turn flow:
Turn 1: User provides transactions → Analyze and store results
Turn 2: User asks about a category → Reference stored analysis, no re-analysis needed
Turn 3: User sets a budget → Store it and use in future calculations
Turn 4: User asks how they're doing → Use stored data and budgets

Always maintain context and make the conversation feel natural and continuous.`,
  tools: [
    analyzeTransactionsTool,
    calculateBudgetStatusTool,
    setBudgetGoalTool,
    generateSpendingReportTool,
  ],
});

/**
 * Alternative: Simple Single-Turn Agent
 * For beginners who want to understand the basics first
 */
export const simpleFinanceAgent = new LlmAgent({
  name: 'simple_finance_agent',
  model: 'gemini-2.5-flash',
  description: 'A simple finance agent for analyzing a single transaction set.',
  instruction: 'You are a helpful finance assistant. Analyze the transactions provided and give a brief summary.',
  tools: [analyzeTransactionsTool, calculateBudgetStatusTool],
});

// Default export for ADK devtools
// ADK devtools expects a rootAgent export
export const rootAgent = personalFinanceAgent;

// Also keep default export for compatibility
export default personalFinanceAgent;
