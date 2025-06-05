import { MCPTool } from '../../types/mcp';

export interface MCPServerConfig {
    name: string;
    type: 'sse';
    url: string;
    headers?: Record<string, string>;
}

export interface MCPConnection {
    type: 'sse';
    url: string;
    eventSource?: any; // EventSource instance
}

export interface MCPServer {
    name: string;
    type: 'sse';
    config: MCPServerConfig;
    connection?: MCPConnection;
    status: 'disconnected' | 'connecting' | 'connected' | 'error';
    tools?: MCPTool[];
    lastError?: string;
}

export interface MCPRequest {
    jsonrpc: '2.0';
    id: string | number;
    method: string;
    params?: any;
}

export interface MCPResponse {
    jsonrpc: '2.0';
    id: string | number;
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
}
