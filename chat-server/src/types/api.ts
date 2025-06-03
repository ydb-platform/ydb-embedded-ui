import { Request, Response } from 'express';
import { ChatCompletionRequest } from './chat';

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: string;
}

export interface HealthCheckResponse {
    status: 'ok' | 'degraded' | 'error';
    timestamp: string;
    uptime: number;
    version: string;
    services: {
        mcp: {
            connected: boolean;
            toolsAvailable: number;
            lastConnected?: string;
            error?: string;
        };
        llm: {
            available: boolean;
            model: string;
            error?: string;
        };
    };
}

export interface ChatRequest extends Request {
    body: ChatCompletionRequest;
}

export interface StreamingResponse extends Response {
    writeSSE: (data: any) => void;
    endSSE: () => void;
}

export interface ToolInvocationRequest extends Request {
    body: {
        toolName: string;
        arguments: Record<string, any>;
    };
}

export interface ErrorResponse {
    error: {
        type: string;
        message: string;
        code?: string;
        details?: any;
    };
    timestamp: string;
    requestId?: string;
}

export interface RateLimitInfo {
    limit: number;
    remaining: number;
    reset: Date;
    retryAfter?: number;
}

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        permissions: string[];
    };
}