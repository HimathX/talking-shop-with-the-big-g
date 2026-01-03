/**
 * Simulated Multi-Turn Conversation with Personal Finance Agent
 *
 * This script demonstrates how to load and run the personal finance agent
 * using Google ADK's InMemoryRunner for a complete conversation flow.
 *
 * Streaming Support:
 * - Uses Server-Sent Events (SSE) streaming for real-time responses
 */

import { InMemoryRunner, StreamingMode } from '@google/adk';
import { personalFinanceAgent } from './agent';
import { createUserContent } from '@google/genai';

/**
 * Helper function to run a conversation turn and collect responses
 */
async function runConversationTurn(
  runner: InMemoryRunner,
  userId: string,
  sessionId: string,
  userMessage: string,
  streamingMode: StreamingMode = StreamingMode.SSE
): Promise<string[]> {
  const responses: string[] = [];

  console.log(`\n🤖 User: ${userMessage}`);
  console.log(`🌊 Streaming mode: ${streamingMode}`);

  const message = createUserContent(userMessage);

  try {
    for await (const event of runner.runAsync({
      userId,
      sessionId,
      newMessage: message,
      runConfig: {
        streamingMode: StreamingMode.SSE
      }
    })) {
      if (event.content && event.content.parts && event.content.parts[0]) {
        const response = event.content.parts[0].text;
        if (response) {
          responses.push(response);
          console.log(`🤖 Agent: ${response}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error during conversation turn:', error);
  }

  return responses;
}

/**
 * Main simulation function
 */
async function simulateConversation() {
  console.log('🚀 Starting Personal Finance Agent Conversation Simulation\n');

  // Create InMemoryRunner with the personal finance agent
  const runner = new InMemoryRunner({
    agent: personalFinanceAgent,
    appName: 'finance_agent_app'
  });

  // Create session
  const session = await runner.sessionService.createSession({
    appName: 'finance_agent_app',
    userId: 'demo-user',
    sessionId: 'demo-session-001'
  });

  console.log('📊 Session created:', session.id);
  console.log('🎯 Starting multi-turn conversation...\n');

  // Multi-turn conversation simulation
  const conversationTurns = [
    // Turn 1: Initial transaction analysis
    {
      message: "Please analyze these transactions: date: 2024-01-15, description: grocery shopping, amount: 150, category: groceries; date: 2024-01-16, description: restaurant dinner, amount: 85, category: dining; date: 2024-01-17, description: gas station, amount: 60, category: transport; date: 2024-01-18, description: movie tickets, amount: 45, category: entertainment; date: 2024-01-19, description: electricity bill, amount: 120, category: utilities. Use the analyze_transactions tool to process this data.",
      note: "First turn - agent should analyze transactions using the analyze_transactions tool"
    },

    // Turn 2: Follow-up question about specific category
    {
      message: "Based on the analysis you just did, which category did I spend the most in?",
      note: "Second turn - agent should reference stored analysis, not re-analyze"
    },

    // Turn 3: Set budget goals
    {
      message: "Please set a budget goal of $200 for dining out using the set_budget_goal tool.",
      note: "Third turn - agent should store budget goals using the set_budget_goal tool"
    },

    // Turn 4: Check budget status
    {
      message: "Using the calculate_budget_status tool, check how I'm doing against my $200 dining budget with $85 spent.",
      note: "Fourth turn - agent should use stored budget and calculate status"
    },

    // Turn 5: Generate report
    {
      message: "Use the generate_spending_report tool to create a comprehensive report with recommendations.",
      note: "Fifth turn - agent should create comprehensive report using all stored data"
    }
  ];

  // Execute each conversation turn
  for (let i = 0; i < conversationTurns.length; i++) {
    const turn = conversationTurns[i];
    console.log(`\n📝 Turn ${i + 1}: ${turn.note}`);
    console.log('─'.repeat(60));

    await runConversationTurn(
      runner,
      'demo-user',
      'demo-session-001',
      turn.message,
      StreamingMode.SSE
    );

    // Small delay between turns for readability
    if (i < conversationTurns.length - 1) {
      console.log('\n⏳ Preparing next question...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n🎉 Conversation simulation completed!');
  console.log('💡 Note: The agent demonstrated session management, but tool calling may require different model configuration or ADK setup.');
  console.log('🔧 For production use, consider using the ADK devtools or checking model compatibility for tool calling.');
}

// Handle script execution
if (require.main === module) {
  simulateConversation().catch(console.error);
}


export { simulateConversation };