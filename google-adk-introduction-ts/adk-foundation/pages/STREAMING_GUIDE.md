# Streaming in ADK - 80/20 Guide

---
zoom: 0.65
---

# Streaming Fundamentals

## Understanding Real-Time Data Flow

### What is Streaming?

**Traditional Request-Response:**
```
Client → [Request] → Server
Client ← [Complete Response] ← Server
```
- Client waits for entire response
- All-or-nothing delivery
- High perceived latency

**Streaming:**
```
Client → [Request] → Server
Client ← [Chunk 1] ← Server
Client ← [Chunk 2] ← Server
Client ← [Chunk 3] ← Server
Client ← [Complete] ← Server
```
- Progressive delivery
- Immediate feedback
- Lower perceived latency

### Core Streaming Concepts

**1. Unidirectional vs Bidirectional**
- **Unidirectional** (Server → Client): SSE, HTTP Streaming
- **Bidirectional** (Server ↔ Client): WebSockets, gRPC Streaming

**2. Push vs Pull**
- **Push**: Server sends data when ready (SSE, WebSockets)
- **Pull**: Client requests updates (Polling, Long Polling)

**3. Backpressure**
- Client controls data flow rate
- Prevents overwhelming slow clients
- Critical for production systems

### Streaming Technologies Comparison

| Technology | Direction | Protocol | Auto-Reconnect | Use Case |
|------------|-----------|----------|----------------|----------|
| **SSE** | Uni (S→C) | HTTP | Yes | Chat, notifications, feeds |
| **WebSocket** | Bidirectional | WS | No | Games, collaboration, voice |
| **Long Polling** | Uni (S→C) | HTTP | Manual | Legacy browser support |
| **HTTP/2 Streams** | Bidirectional | HTTP/2 | No | Multiplexed requests |

**Why SSE for AI Agents?**
- Simple implementation
- Built-in reconnection
- Works with existing HTTP infrastructure
- Perfect for text streaming (LLM responses)

---
zoom: 0.65
---

# Streaming Responses in ADK

## Real-Time Agent Communication

### Why Streaming Matters

**User Experience Benefits:**
- **Lower Perceived Latency** - Users see responses immediately
- **Better Engagement** - Token-by-token display feels more natural
- **Cancellable** - Stop long responses mid-generation
- **Real-Time Feedback** - Know the agent is working

### ADK Streaming Modes

**1. SSE (Server-Sent Events)** - Recommended for most use cases
```typescript
for await (const event of runner.runAsync({
  userId: 'user123',
  sessionId: 'session456',
  newMessage: userMessage,
  runConfig: {
    streamingMode: 'SSE', // Server-Sent Events
  },
})) {
  if (event.content) {
    // Stream each token as it arrives
    process.stdout.write(event.content.parts[0].text);
  }
}
```

**2. BIDI (Bidirectional)** - For advanced use cases (WebSockets)
- Two-way communication
- Live voice conversations
- Interactive multi-turn flows

---
zoom: 0.65
---

# Implementing SSE Streaming

## Server-Sent Events in Practice

### Server-Side (Express + ADK)

```typescript
import express from 'express';
import { Runner, LlmAgent } from '@google/adk';

const app = express();

app.get('/stream', async (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const runner = new Runner({ agent: myAgent });

  for await (const event of runner.runAsync({
    userId: req.query.userId,
    sessionId: req.query.sessionId,
    newMessage: { parts: [{ text: req.query.message }] },
    runConfig: { streamingMode: 'SSE' },
  })) {
    if (event.content) {
      // Send SSE formatted data
      res.write(`data: ${JSON.stringify(event)}\\n\\n`);
    }
  }

  res.end();
});
```

### Client-Side (Browser)

```typescript
const eventSource = new EventSource('/stream?userId=user123&sessionId=session456&message=Hello');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.content) {
    // Append token to UI
    document.getElementById('response').textContent += data.content.parts[0].text;
  }
};

eventSource.onerror = () => {
  console.error('Connection lost, auto-reconnecting...');
  // EventSource auto-reconnects!
};
```

### Key SSE Characteristics

**Advantages:**
- HTTP-based (no WebSocket upgrade needed)
- Automatic reconnection on disconnect
- Simple unidirectional flow (server → client)
- Perfect for chat applications

**When to Use:**
- Text-based chat interfaces
- Real-time notifications
- Live dashboards
- Progress updates

**When to Use BIDI Instead:**
- Live voice conversations
- Interactive games
- Collaborative editing
- Two-way real-time communication

---
zoom: 0.6
---

# Web Streams API (1/2)

## ReadableStream & WritableStream

### What is Web Streams API?

**Modern browser/Node.js API for streaming data**
- Native support in browsers and Node.js 16+
- Three core primitives: `ReadableStream`, `WritableStream`, `TransformStream`
- Backpressure handling built-in
- Composable and chainable

### ReadableStream - Creating a Data Source

```typescript
// Create a custom readable stream
const readableStream = new ReadableStream({
  start(controller) {
    // Called immediately when stream is created
    console.log('Stream started');
  },
  
  async pull(controller) {
    // Called when consumer is ready for more data
    const chunk = await fetchNextChunk();
    
    if (chunk) {
      controller.enqueue(chunk); // Send data to consumer
    } else {
      controller.close(); // No more data
    }
  },
  
  cancel(reason) {
    // Called if consumer cancels the stream
    console.log('Stream cancelled:', reason);
  }
});

// Consume the stream
const reader = readableStream.getReader();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log('Received:', value);
}
```

### WritableStream - Creating a Data Sink

```typescript
// Create a writable stream
const writableStream = new WritableStream({
  write(chunk) {
    // Process each chunk
    console.log('Writing:', chunk);
    return saveToDatabase(chunk);
  },
  
  close() {
    console.log('Stream closed');
  },
  
  abort(reason) {
    console.error('Stream aborted:', reason);
  }
});

// Write data to the stream
const writer = writableStream.getWriter();
await writer.write('Hello');
await writer.write('World');
await writer.close();
```

---
zoom: 0.6
---

# Web Streams API (2/4)

## TransformStream Basics

### TransformStream - Processing Data in Transit

**What is TransformStream?**
- Sits between ReadableStream and WritableStream
- Transforms data as it flows through
- Chainable with `pipeThrough()` and `pipeTo()`

```typescript
// Create a transform stream (uppercase transformer)
const uppercaseTransform = new TransformStream({
  transform(chunk, controller) {
    // Transform each chunk
    const uppercased = chunk.toString().toUpperCase();
    controller.enqueue(uppercased);
  }
});

// Chain streams together
readableStream
  .pipeThrough(uppercaseTransform)
  .pipeTo(writableStream);
```

**Common Use Cases:**
- Text encoding/decoding
- Data compression
- Format conversion
- Rate limiting
- Filtering

---
zoom: 0.6
---

# Web Streams API (3/4)

## Real-World Streaming Examples

### Streaming LLM Responses with Fetch API

```typescript
// Fetch API with streaming
async function streamLLMResponse(prompt: string) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
    headers: { 'Content-Type': 'application/json' },
  });

  // Response body is a ReadableStream
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Decode and display chunk
    const chunk = decoder.decode(value, { stream: true });
    displayToken(chunk);
  }
}
```

### Streaming with Backpressure

```typescript
// Transform stream with backpressure handling
const rateLimitedTransform = new TransformStream({
  async transform(chunk, controller) {
    // Simulate slow processing
    await new Promise(resolve => setTimeout(resolve, 100));
    controller.enqueue(chunk);
  }
}, {
  // Backpressure strategy
  highWaterMark: 5, // Buffer up to 5 chunks
  size: () => 1,    // Each chunk counts as 1
});

// Stream automatically pauses when buffer is full
// Resumes when consumer catches up
```

**Why Backpressure Matters:**
- Prevents memory overflow
- Handles slow consumers gracefully
- Production-critical feature

---
zoom: 0.6
---

# Web Streams API (4/4)

## ADK + Web Streams Integration

### Converting ADK Events to ReadableStream

```typescript
// Convert ADK events to ReadableStream
function adkToReadableStream(runner: Runner, request: RunRequest) {
  return new ReadableStream({
    async start(controller) {
      for await (const event of runner.runAsync(request)) {
        if (event.content) {
          controller.enqueue(event.content.parts[0].text);
        }
      }
      controller.close();
    }
  });
}
```

### Using with Response API

```typescript
// Express/Node.js endpoint
app.get('/stream', async (req, res) => {
  const stream = adkToReadableStream(runner, {
    userId: 'user123',
    sessionId: 'session456',
    newMessage: { parts: [{ text: req.query.message }] },
  });

  // Return as HTTP response
  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain' },
  });
});
```

### Complete Pipeline Example

```typescript
// Chain ADK → Transform → Response
const adkStream = adkToReadableStream(runner, request);

const formattedStream = adkStream
  .pipeThrough(new TextEncoderStream())
  .pipeThrough(rateLimitedTransform)
  .pipeThrough(new TextDecoderStream());

return new Response(formattedStream);
```

**Key Takeaways:**
- Web Streams API is the modern standard
- Built-in backpressure prevents memory issues
- Composable with `pipeThrough()` and `pipeTo()`
- Works seamlessly with Fetch API and ADK
- Perfect for production LLM streaming

---
