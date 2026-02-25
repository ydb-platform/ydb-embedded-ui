import type {QueryResponseChunk, SessionChunk, StreamDataChunk} from '../../types/store/streaming';

// Messages from main thread to worker
export interface StreamWorkerStartMessage {
    type: 'start';
    requestId: string;
    url: string;
    headers: Record<string, string>;
    body: string;
    credentials: RequestCredentials;
}

export interface StreamWorkerAbortMessage {
    type: 'abort';
    requestId: string;
}

export type StreamWorkerRequest = StreamWorkerStartMessage | StreamWorkerAbortMessage;

// Messages from worker to main thread
export interface StreamWorkerSessionMessage {
    type: 'session';
    requestId: string;
    chunk: SessionChunk;
}

export interface StreamWorkerDataMessage {
    type: 'data';
    requestId: string;
    chunk: StreamDataChunk;
}

export interface StreamWorkerResponseMessage {
    type: 'response';
    requestId: string;
    chunk: QueryResponseChunk;
}

export interface StreamWorkerKeepaliveMessage {
    type: 'keepalive';
    requestId: string;
}

export interface StreamWorkerErrorMessage {
    type: 'error';
    requestId: string;
    error: unknown;
}

export interface StreamWorkerDoneMessage {
    type: 'done';
    requestId: string;
}

export interface StreamWorkerAuthRedirectMessage {
    type: 'auth-redirect';
    requestId: string;
    authUrl: string;
}

export type StreamWorkerResponse =
    | StreamWorkerSessionMessage
    | StreamWorkerDataMessage
    | StreamWorkerResponseMessage
    | StreamWorkerKeepaliveMessage
    | StreamWorkerErrorMessage
    | StreamWorkerDoneMessage
    | StreamWorkerAuthRedirectMessage;
