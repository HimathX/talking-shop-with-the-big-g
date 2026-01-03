import { Hono } from 'hono';
import { streamText } from 'hono/streaming';
import { InMemoryRunner, StreamingMode, Event } from '@google/adk';
import { personalFinanceAgent } from './agent';
import { createUserContent, Part } from '@google/genai';

// Check for required environment variables
console.log('🔍 Checking environment variables...');
const requiredEnvVars = ['GOOGLE_GENAI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);

console.log('Current environment variables:', {
  GOOGLE_GENAI_API_KEY: process.env.GOOGLE_GENAI_API_KEY ? '✅ Set' : '❌ Missing',
  GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT ? '✅ Set' : '❌ Missing',
  GOOGLE_CLOUD_LOCATION: process.env.GOOGLE_CLOUD_LOCATION ? '✅ Set' : '❌ Missing',
});

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  console.error('Please set the following environment variables:');
  missingEnvVars.forEach(key => console.error(`  export ${key}="your-value-here"`));
  console.error('See env.example for details');
  process.exit(1);
}
console.log('✅ All required environment variables are set');

// Create global runner instance (like the working simulation)
const appName = 'finance_agent_app';
const globalRunner = new InMemoryRunner({
  agent: personalFinanceAgent,
  appName,
});

const app = new Hono();

app.get('/', (c) => {
  return c.text('Finance Agent Hono Server is running!');
});

app.post('/chat', async (c) => {
  const { message, userId = 'default-user', sessionId = 'default-session' } = await c.req.json();

  if (!message) {
    return c.json({ error: 'Message is required' }, 400);
  }

  // Get or create session - don't recreate existing sessions!
  console.log(`Checking session: ${sessionId} for user: ${userId}`);
  let session: Awaited<ReturnType<typeof globalRunner.sessionService.getSession>>;
  try {
    // Try to get existing session first
    session = await globalRunner.sessionService.getSession({
      appName,
      userId,
      sessionId,
    });
    console.log(`✅ Using existing session: ${session!.id}`);
  } catch (error) {
    // Session doesn't exist, create a new one
    console.log(`📝 Creating new session: ${sessionId}`);
    try {
      session = await globalRunner.sessionService.createSession({
        appName,
        userId,
        sessionId,
        state: {},
      });
      console.log(`✅ New session created: ${session.id}`);
    } catch (createError) {
      console.error('❌ Failed to create session:', createError);
      return c.json({ error: 'Failed to create or retrieve session' }, 500);
    }
  }

  return streamText(c, async (stream) => {
    // Set up abort handling
    stream.onAbort(() => {
      console.log('Stream aborted');
    });

    try {
      console.log(`Processing message for user ${userId}, session ${sessionId}`);
      const userContent = createUserContent(message);
      console.log('Created user content, starting runner...');

      let eventCount = 0;
      for await (const event of globalRunner.runAsync({
        userId,
        sessionId,
        newMessage: userContent,
        runConfig: {
          streamingMode: StreamingMode.SSE,
        },
      })) {
        eventCount++;
        const adkEvent = event as Event;
        console.log(`Event ${eventCount}:`, {
          hasContent: !!adkEvent.content,
          hasParts: !!adkEvent.content?.parts,
          author: adkEvent.author,
          final: !!(adkEvent as any).final
        });

        if (adkEvent.content?.parts?.[0]?.text) {
          const text = adkEvent.content.parts[0].text;
          console.log(`Writing text chunk: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
          await stream.write(text);
        } else if ((adkEvent as any).final) {
          console.log('Final event received, ending stream');
          break;
        }
      }

      console.log(`Processed ${eventCount} events total`);
    } catch (error) {
      const err = error as Error;
      console.error('Streaming error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      await stream.write(`\n[Error: ${err.message}]`);
    }
  });
});

export default {
  port: 3000,
  fetch: app.fetch,
};
