/**
 * Simulated Server Chat Conversation with Personal Finance Agent
 *
 * This script demonstrates how to interact with the Hono server
 * that wraps the personal finance agent using HTTP requests.
 *
 * Features:
 * - Starts the Hono server in the background
 * - Sends streaming requests to the server
 * - Collects and displays responses
 * - Multi-turn conversation simulation
 */

import { createUserContent } from '@google/genai';

/**
 * Helper function to make a streaming request to the server
 */
async function makeStreamingRequest(
  message: string,
  userId: string = 'server-demo-user',
  sessionId: string = 'server-demo-session'
): Promise<string> {
  const response = await fetch('http://localhost:3000/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      userId,
      sessionId,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // Read the streaming response
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';

  if (!reader) {
    throw new Error('No response body');
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    fullResponse += chunk;
    process.stdout.write(chunk);
  }

  return fullResponse;
}

/**
 * Helper function to run a conversation turn
 */
async function runServerConversationTurn(
  userMessage: string,
  userId: string,
  sessionId: string
): Promise<string> {
  console.log(`\n🤖 User: ${userMessage}`);
  console.log(`🌐 Sending to server...`);

  try {
    const response = await makeStreamingRequest(userMessage, userId, sessionId);
    console.log(); // New line after streaming
    return response;
  } catch (error) {
    console.error('❌ Error during server request:', error);
    return '';
  }
}

/**
 * Start the Hono server in the background
 */
async function startServer(): Promise<{ child: any }> {
  console.log('🚀 Starting Hono server...');

  const { spawn } = await import('child_process');

  const child = spawn('bun', ['run', 'server.ts'], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // Wait a bit for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Check if server is running
  try {
    const response = await fetch('http://localhost:3000');
    if (response.ok) {
      console.log('✅ Server is running on http://localhost:3000');
      return { child };
    }
  } catch (error) {
    console.error('❌ Server failed to start:', error);
    child.kill();
    throw error;
  }

  return { child };
}

/**
 * Main simulation function
 */
async function simulateServerConversation(autoStartServer: boolean = false) {
  console.log('🌐 Starting Server Chat Conversation Simulation\n');

  let serverProcess: any = null;

  try {
    if (autoStartServer) {
      const { child } = await startServer();
      serverProcess = child;
    } else {
      console.log('ℹ️  Assuming server is already running on http://localhost:3000');
      console.log('ℹ️  Run "bun run serve" in another terminal, or use --start-server flag\n');
    }

    // Multi-turn conversation simulation
    const conversationTurns = [
      // Turn 1: Initial transaction analysis
      {
        message: "Please analyze these transactions: date: 2024-01-15, description: grocery shopping, amount: 150, category: groceries; date: 2024-01-16, description: restaurant dinner, amount: 85, category: dining; date: 2024-01-17, description: gas station, amount: 60, category: transport; date: 2024-01-18, description: movie tickets, amount: 45, category: entertainment; date: 2024-01-19, description: electricity bill, amount: 120, category: utilities. Use the analyze_transactions tool to process this data.",
        note: "First turn - server should analyze transactions using the analyze_transactions tool"
      },

      // Turn 2: Follow-up question about specific category
      {
        message: "Based on the analysis you just did, which category did I spend the most in?",
        note: "Second turn - server should reference stored analysis, not re-analyze"
      },

      // Turn 3: Set budget goals
      {
        message: "Please set a budget goal of $200 for dining out using the set_budget_goal tool.",
        note: "Third turn - server should store budget goals using the set_budget_goal tool"
      },

      // Turn 4: Check budget status
      {
        message: "Using the calculate_budget_status tool, check how I'm doing against my $200 dining budget with $85 spent.",
        note: "Fourth turn - server should use stored budget and calculate status"
      },

      // Turn 5: Generate report
      {
        message: "Use the generate_spending_report tool to create a comprehensive report with recommendations.",
        note: "Fifth turn - server should create comprehensive report using all stored data"
      }
    ];

    const sessionId = 'server-conversation-' + Date.now();

    // Execute each conversation turn
    for (let i = 0; i < conversationTurns.length; i++) {
      const turn = conversationTurns[i];
      console.log(`\n📝 Turn ${i + 1}: ${turn.note}`);
      console.log('─'.repeat(60));

      await runServerConversationTurn(
        turn.message,
        'server-demo-user',
        sessionId
      );

      // Small delay between turns for readability
      if (i < conversationTurns.length - 1) {
        console.log('\n⏳ Preparing next question...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n🎉 Server conversation simulation completed!');
    console.log('💡 Note: The server demonstrated session management and tool calling through HTTP requests.');

  } finally {
    // Clean up server if we started it
    if (serverProcess) {
      console.log('\n🛑 Stopping server...');
      serverProcess.kill();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Handle script execution
const args = process.argv.slice(2);
const autoStartServer = args.includes('--start-server');

if (require.main === module) {
  simulateServerConversation(autoStartServer).catch(console.error);
}

export { simulateServerConversation };