# YDB Embedded UI Chat Feature - Agent Loop Architecture

## System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React UI      │◄──►│  Chat Server     │◄──►│   Eliza API     │
│                 │    │                  │    │                 │
│ - ChatPanel     │    │ - Agent Loop     │    │ - OpenAI Compat │
│ - ChatMessage   │    │ - Tool Execution │    │ - Streaming     │
│ - Redux State   │    │ - Iterative      │    │ - Tool Calls    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   MCP Server    │
                       │                 │
                       │ - YDB Tools     │
                       │ - Data Access   │
                       └─────────────────┘
```

## Agent Loop Architecture

### Core Principle
**LLM autonomously decides when to call tools and when to stop**

### Agent Loop Flow

```
for iteration in range(maxIterations):
    1. LLM analyzes conversation + available tools
    2. LLM decides: call tools OR give final answer
    3. If tools called:
       - Execute all tools
       - Add results to conversation
       - Continue to next iteration
    4. If no tools called:
       - LLM gave final answer
       - Stop loop
```

## Request Flow Example

### User: "Проверь здоровье всех баз данных в кластере prod"

#### Iteration 1:
```
LLM: "Сначала получу список кластеров, чтобы найти prod"
→ Calls: ydb-get-clusters
→ Result: [prod, dev, test]
→ Continue to iteration 2
```

#### Iteration 2:
```
LLM: "Теперь получу базы данных в кластере prod"
→ Calls: ydb-get-databases(cluster="prod")
→ Result: [db1, db2, db3]
→ Continue to iteration 3
```

#### Iteration 3:
```
LLM: "Проверю здоровье каждой базы данных"
→ Calls: ydb-get-database-health(cluster="prod", database="db1")
→ Calls: ydb-get-database-health(cluster="prod", database="db2")
→ Calls: ydb-get-database-health(cluster="prod", database="db3")
→ Results: [healthy, warning, error]
→ Continue to iteration 4
```

#### Iteration 4:
```
LLM: "У меня есть вся информация. Вот отчет о здоровье баз данных..."
→ No tool calls - gives final comprehensive answer
→ Loop stops
```

## Implementation Details

### ChatService.processChat()

```typescript
async processChat(messages, onData, options) {
  const maxIterations = options.maxIterations || 5;
  const conversationHistory = [systemPrompt, ...cleanedMessages];
  
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // 1. LLM call with streaming
    const stream = await llmService.createStreamingChatCompletion({
      messages: conversationHistory,
      tools: availableTools
    });
    
    // 2. Process streaming response
    let toolCalls = [];
    for await (const chunk of stream) {
      if (chunk.content) {
        // Stream content to frontend
        onData(contentDelta);
      }
      if (chunk.tool_calls) {
        // Accumulate tool calls
        toolCalls.push(...chunk.tool_calls);
      }
    }
    
    // 3. Add assistant message to history
    conversationHistory.push({
      role: 'assistant',
      content: accumulatedContent,
      tool_calls: toolCalls
    });
    
    // 4. Check if loop should stop
    if (toolCalls.length === 0) {
      break; // LLM gave final answer
    }
    
    // 5. Execute tools and add results
    for (const toolCall of toolCalls) {
      const result = await mcpService.callTool(toolCall);
      conversationHistory.push({
        role: 'tool',
        content: JSON.stringify(result),
        tool_call_id: toolCall.id
      });
    }
    
    // 6. Continue to next iteration
  }
}
```

### System Prompt

```
Ты - помощник для работы с YDB (базой данных).

ВАЖНЫЕ ПРАВИЛА:
1. ВСЕГДА объясняй что ты собираешься делать ДО вызова инструментов
2. Анализируй результаты инструментов и решай нужны ли дополнительные вызовы
3. Когда у тебя есть вся необходимая информация, дай финальный ответ БЕЗ вызова инструментов
4. Используй дружелюбный тон и объясняй техническую информацию простым языком

У тебя есть доступ к инструментам для работы с YDB - используй их по необходимости.
Отвечай на русском языке.
```

## Data Flow Types

### ChatDelta (Streaming Output)
```typescript
type ChatDelta = {
  type: 'content' | 'tool_call' | 'tool_executing' | 'tool_result' | 'tool_error' | 'done' | 'error'
  content?: string
  tool_calls?: ToolCall[]
  tool_name?: string
  tool_id?: string
  result?: any
  error?: string
}
```

### Agent Loop Options
```typescript
interface AgentOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  maxIterations?: number  // Default: 5
}
```

## API Design

### Single Endpoint
```
POST /api/chat
{
  "messages": [conversation history],
  "model": "gpt-4.1",
  "maxIterations": 5
}
```

### Response Format (SSE)
```
data: {"type":"content","content":"Сначала получу список кластеров..."}
data: {"type":"tool_call","tool_calls":[{"name":"ydb-get-clusters"}]}
data: {"type":"tool_executing","tool_name":"ydb-get-clusters"}
data: {"type":"tool_result","result":[...]}
data: {"type":"content","content":"Теперь получу базы данных..."}
data: {"type":"tool_call","tool_calls":[{"name":"ydb-get-databases"}]}
data: {"type":"tool_executing","tool_name":"ydb-get-databases"}
data: {"type":"tool_result","result":[...]}
data: {"type":"content","content":"Вот полный отчет о здоровье..."}
data: {"type":"done"}
```

## Benefits of Agent Loop

### Intelligence
- **Autonomous Planning**: LLM decides what tools to call and in what order
- **Context Awareness**: Each iteration builds on previous results
- **Natural Stopping**: LLM knows when it has enough information

### User Experience
- **Transparent Process**: Users see the thinking process
- **Progressive Disclosure**: Information revealed step by step
- **Comprehensive Answers**: Multi-step queries handled automatically

### Technical
- **Stateless**: No server-side session management
- **Streaming**: Real-time feedback during execution
- **Error Recovery**: Failed tools don't break the conversation
- **Bounded Execution**: maxIterations prevents infinite loops

## Comparison with Previous Architecture

### Before (Two-Phase)
```
1. LLM → Tool calls
2. Execute ALL tools
3. Follow-up LLM call for explanation
```
**Limitations**: No iterative planning, fixed execution pattern

### After (Agent Loop)
```
1. LLM → Decides what to do
2. Execute tools if needed
3. LLM → Analyzes results, decides next steps
4. Repeat until complete
```
**Advantages**: Intelligent planning, adaptive execution, natural conversation flow

## Safety & Limits

### Iteration Limits
- **Default**: 5 iterations maximum
- **Configurable**: Can be adjusted per request
- **Logging**: Each iteration logged for debugging

### Error Handling
- **Tool Failures**: Added to conversation, LLM can adapt
- **Network Issues**: Graceful degradation
- **Infinite Loops**: Prevented by iteration limit

### Resource Management
- **Streaming**: Immediate feedback, no buffering
- **Memory**: Conversation history grows but bounded
- **Timeouts**: Each LLM call has timeout protection

## Tool Integration

### YDB MCP Tools
- **Auto-discovery**: Tools loaded from MCP server
- **Rich Schemas**: Full parameter descriptions for LLM
- **Error Handling**: Tool failures handled gracefully

### Tool Execution
- **Parallel**: Multiple tools can be called in one iteration
- **Sequential**: Results available for next iteration
- **Contextual**: LLM sees all previous tool results

This Agent Loop architecture provides intelligent, autonomous interaction with YDB while maintaining simplicity and transparency for users.
