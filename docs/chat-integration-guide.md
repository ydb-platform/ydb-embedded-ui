# Chat Integration Guide

## Quick Start

### 1. Environment Setup

Copy the environment template and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Required for chat functionality
ELIZA_KEY=your-eliza-api-key-here
ELIZA_BASE_URL=https://api.eliza.yandex.net/raw/openai/v1
MODEL_NAME=gpt-4o-mini
MCP_SERVER_URL=http://ui-dev-0.ydb.yandex.net:8784/meta/mcp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm start
```

The application will start on `http://localhost:3000` with the chat feature enabled.

## Testing the Chat Feature

### 1. Basic Functionality Test

1. **Open Chat**: Click the floating chat button (💬) in the bottom-right corner
2. **Send Message**: Type "Hello" and press Enter or click Send
3. **Verify Response**: You should see a streaming response from the AI assistant
4. **Close Chat**: Click the X button or click outside the chat panel

### 2. Tool Integration Test

Try these example queries to test MCP tool integration:

```
Show me the available YDB clusters
```

```
Get the health status of the main cluster
```

```
List all databases in the cluster
```

### 3. Error Handling Test

1. **Network Error**: Disconnect internet and try sending a message
2. **Invalid Input**: Send very long messages or special characters
3. **Tool Errors**: Try queries that might fail (non-existent databases, etc.)

## Health Check

The chat system provides a health endpoint to verify everything is working:

```bash
curl http://localhost:3000/chat/health
```

Expected response:
```json
{
  "status": "ok",
  "mcpConnected": true,
  "toolsAvailable": 25
}
```

## Available MCP Tools

The system automatically discovers available tools from the MCP server. You can view them at:

```bash
curl http://localhost:3000/chat/tools
```

### Key YDB Tools Available

1. **Cluster Management**
   - `ydb-get-clusters` - List all clusters
   - `ydb-get-cluster-health-check` - Check cluster health
   - `ydb-get-cluster` - Get cluster details

2. **Database Operations**
   - `ydb-get-databases` - List databases
   - `ydb-get-database-info` - Get database details
   - `ydb-get-database-health-check` - Check database health

3. **Query Execution**
   - `ydb-post-query` - Execute SQL queries
   - `ydb-get-autocomplete` - Get query suggestions

4. **Schema Operations**
   - `ydb-get-describe` - Describe schema objects
   - `ydb-get-scheme-directory` - Browse schema directories

5. **Monitoring**
   - `ydb-post-render` - Get metrics data
   - `ydb-get-nodes` - Get node information

## Troubleshooting

### Common Issues

#### 1. Chat Button Not Visible
- **Check**: Ensure the chat reducer is added to the Redux store
- **Fix**: Verify `src/store/reducers/index.ts` includes the chat reducer

#### 2. No Response from Chat
- **Check**: Environment variables are set correctly
- **Check**: MCP server is accessible
- **Fix**: Verify `.env` configuration and network connectivity

#### 3. Tool Calls Failing
- **Check**: MCP server URL is correct and accessible
- **Check**: Authentication/permissions for YDB access
- **Fix**: Verify MCP server configuration and credentials

#### 4. Streaming Not Working
- **Check**: Browser supports Server-Sent Events
- **Check**: No proxy/firewall blocking SSE
- **Fix**: Test with different browsers or network configurations

### Debug Mode

Enable debug logging by adding to your `.env`:

```bash
DEBUG=chat:*
```

This will show detailed logs in the browser console and server logs.

### Network Issues

If you're behind a corporate firewall or proxy:

1. **Proxy Configuration**: Ensure your proxy allows SSE connections
2. **CORS Issues**: The setupProxy.js handles CORS, but verify your network allows the requests
3. **SSL/TLS**: Ensure certificates are valid for the Eliza API endpoint

## Production Deployment

### 1. Environment Variables

Set production environment variables:

```bash
ELIZA_KEY=production-api-key
ELIZA_BASE_URL=https://api.eliza.yandex.net/raw/openai/v1
MCP_SERVER_URL=https://your-production-mcp-server/meta/mcp
```

### 2. Build Configuration

The chat feature is included in the standard build process:

```bash
npm run build
```

### 3. Security Considerations

- **API Keys**: Never expose API keys in client-side code
- **Rate Limiting**: Consider implementing rate limiting for chat requests
- **Authentication**: Ensure proper user authentication before allowing chat access
- **Content Filtering**: Consider implementing content filtering for sensitive environments

### 4. Monitoring

Monitor these metrics in production:

- Chat request volume and response times
- MCP server connectivity and tool success rates
- Error rates and types
- User engagement with chat feature

## Integration with Existing Features

### 1. Navigation Integration

The chat can be integrated with existing navigation:

```typescript
// Example: Open chat with pre-filled query when viewing a database
const openChatWithQuery = (query: string) => {
  dispatch(chatActions.openChat());
  // Add logic to pre-fill input
};
```

### 2. Context Awareness

The chat can be made context-aware:

```typescript
// Example: Include current page context in chat queries
const getCurrentContext = () => {
  return {
    currentPage: window.location.pathname,
    selectedDatabase: currentDatabase,
    userRole: userPermissions
  };
};
```

### 3. Custom Tool Integration

Add custom tools by extending the MCP server or creating new endpoints in setupProxy.js.

## Performance Optimization

### 1. Message Caching

Consider implementing message caching for frequently asked questions.

### 2. Lazy Loading

The chat components are already set up for lazy loading to reduce initial bundle size.

### 3. Connection Pooling

The setupProxy.js maintains persistent connections to the MCP server for better performance.

## Support and Maintenance

### 1. Logs

Chat-related logs are available in:
- Browser console (client-side errors)
- Server logs (proxy and MCP communication)
- MCP server logs (tool execution)

### 2. Updates

To update the chat feature:
1. Update dependencies: `npm update`
2. Check for MCP server updates
3. Review and update environment variables
4. Test thoroughly before deploying

### 3. Backup and Recovery

The chat feature doesn't store persistent data by default, but consider:
- Backing up chat configurations
- Documenting custom tool integrations
- Maintaining environment variable backups

## Next Steps

After successful integration:

1. **User Training**: Provide documentation on available chat commands
2. **Feedback Collection**: Gather user feedback for improvements
3. **Feature Expansion**: Consider adding more YDB-specific tools
4. **Performance Monitoring**: Set up monitoring and alerting
5. **Security Review**: Regular security audits of the chat system