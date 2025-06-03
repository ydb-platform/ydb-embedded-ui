export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly code?: string;
    public readonly details?: any;

    constructor(
        message: string,
        statusCode: number = 500,
        isOperational: boolean = true,
        code?: string,
        details?: any
    ) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        if (code !== undefined) this.code = code;
        if (details !== undefined) this.details = details;

        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string, details?: any) {
        super(message, 400, true, 'VALIDATION_ERROR', details);
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string = 'Authentication failed') {
        super(message, 401, true, 'AUTHENTICATION_ERROR');
    }
}

export class AuthorizationError extends AppError {
    constructor(message: string = 'Access denied') {
        super(message, 403, true, 'AUTHORIZATION_ERROR');
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource') {
        super(`${resource} not found`, 404, true, 'NOT_FOUND_ERROR');
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409, true, 'CONFLICT_ERROR');
    }
}

export class RateLimitError extends AppError {
    constructor(message: string = 'Rate limit exceeded') {
        super(message, 429, true, 'RATE_LIMIT_ERROR');
    }
}

export class MCPConnectionError extends AppError {
    constructor(message: string = 'MCP server connection failed') {
        super(message, 503, true, 'MCP_CONNECTION_ERROR');
    }
}

export class LLMServiceError extends AppError {
    constructor(message: string = 'LLM service error') {
        super(message, 502, true, 'LLM_SERVICE_ERROR');
    }
}

export class ToolExecutionError extends AppError {
    constructor(toolName: string, originalError?: Error) {
        const message = `Tool execution failed: ${toolName}`;
        super(
            message,
            500,
            true,
            'TOOL_EXECUTION_ERROR',
            {
                toolName,
                originalError: originalError?.message,
                originalStack: originalError?.stack,
            }
        );
    }
}

export class StreamingError extends AppError {
    constructor(message: string = 'Streaming error') {
        super(message, 500, true, 'STREAMING_ERROR');
    }
}

// Error type guards
export function isAppError(error: any): error is AppError {
    return error instanceof AppError;
}

export function isOperationalError(error: any): boolean {
    return isAppError(error) && error.isOperational;
}

// Error factory functions
export function createValidationError(field: string, value: any, constraint: string): ValidationError {
    return new ValidationError(`Validation failed for field '${field}'`, {
        field,
        value,
        constraint,
    });
}

export function createMCPError(operation: string, originalError?: Error): MCPConnectionError {
    return new MCPConnectionError(`MCP ${operation} failed: ${originalError?.message || 'Unknown error'}`);
}

export function createLLMError(operation: string, originalError?: Error): LLMServiceError {
    return new LLMServiceError(`LLM ${operation} failed: ${originalError?.message || 'Unknown error'}`);
}

// Error response formatter
export function formatErrorResponse(error: AppError | Error, requestId?: string) {
    const isAppErr = isAppError(error);
    
    return {
        error: {
            type: isAppErr ? error.constructor.name : 'InternalServerError',
            message: error.message,
            code: isAppErr ? error.code : 'INTERNAL_ERROR',
            details: isAppErr ? error.details : undefined,
        },
        timestamp: new Date().toISOString(),
        requestId,
    };
}

// Error severity levels
export enum ErrorSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

export function getErrorSeverity(error: AppError | Error): ErrorSeverity {
    if (!isAppError(error)) {
        return ErrorSeverity.HIGH;
    }

    switch (error.statusCode) {
        case 400:
        case 401:
        case 403:
        case 404:
        case 409:
            return ErrorSeverity.LOW;
        case 429:
            return ErrorSeverity.MEDIUM;
        case 500:
        case 502:
        case 503:
            return ErrorSeverity.HIGH;
        default:
            return ErrorSeverity.MEDIUM;
    }
}