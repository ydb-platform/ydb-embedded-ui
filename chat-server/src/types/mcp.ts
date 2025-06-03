export interface MCPTool {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: Record<string, any>;
        required?: string[];
    };
}

export interface MCPToolCall {
    name: string;
    arguments: Record<string, any>;
}

export interface MCPToolResult {
    content: Array<{
        type: 'text' | 'image' | 'resource';
        text?: string;
        data?: string;
        mimeType?: string;
    }>;
    isError?: boolean;
}

export interface MCPServerInfo {
    name: string;
    version: string;
    protocolVersion: string;
    capabilities: {
        tools?: {
            listChanged?: boolean;
        };
        resources?: {
            subscribe?: boolean;
            listChanged?: boolean;
        };
        prompts?: {
            listChanged?: boolean;
        };
        logging?: {};
    };
}

export interface MCPConnectionStatus {
    connected: boolean;
    serverInfo?: MCPServerInfo;
    toolsCount: number;
    lastConnected?: Date;
    lastError?: string;
}

export interface MCPClientConfig {
    serverUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
}

export interface MCPResource {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
}

export interface MCPMessage {
    jsonrpc: '2.0';
    id?: string | number;
    method?: string;
    params?: any;
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
}

export interface MCPRequest extends MCPMessage {
    method: string;
    params?: any;
}

export interface MCPResponse extends MCPMessage {
    id: string | number;
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
}

export interface MCPServerConfig {
    name: string;
    type: 'stdio' | 'sse';
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    cwd?: string;
    url?: string;
    headers?: Record<string, string>;
}

export interface MCPConnection {
    type: 'stdio' | 'sse';
    process?: any;
    stdin?: any;
    stdout?: any;
    stderr?: any;
    url?: string;
    eventSource?: any;
}

export interface MCPServer {
    id: string;
    name: string;
    type: 'stdio' | 'sse';
    config: MCPServerConfig;
    status: 'connected' | 'disconnected' | 'error' | 'connecting';
    tools: MCPTool[];
    resources: MCPResource[];
    capabilities: {
        tools?: boolean;
        resources?: boolean;
        prompts?: boolean;
    };
    lastHeartbeat: number | null;
    connection: MCPConnection | null;
}