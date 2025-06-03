import { logger } from '../../utils/logger';
import { MCPServer, MCPServerConfig, MCPRequest, MCPResponse } from './types';

export class SSEConnectionManager {
    /**
     * Connect to an SSE MCP server
     */
    async connect(server: MCPServer, config: MCPServerConfig): Promise<void> {
        if (server.status === 'connected') {
            logger.warn('Server already connected', { name: server.name });
            return;
        }

        server.status = 'connecting';
        logger.info('Connecting to SSE MCP server', { name: server.name, url: config.url });

        try {
            // Connect to get session endpoint
            const response = await fetch(config.url, {
                method: 'GET',
                headers: {
                    'Accept': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    ...config.headers,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Parse the SSE stream to get the session endpoint
            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Failed to get response reader');
            }

            const decoder = new TextDecoder();
            let sessionEndpoint: string | null = null;

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.substring(6).trim();
                            if (data.startsWith('/meta/mcp?session_id=')) {
                                sessionEndpoint = data;
                                break;
                            }
                        }
                    }

                    if (sessionEndpoint) break;
                }
            } finally {
                reader.releaseLock();
            }

            if (!sessionEndpoint) {
                throw new Error('Failed to get session endpoint from MCP server');
            }

            const fullSessionUrl = new URL(sessionEndpoint, config.url).toString();

            server.connection = {
                type: 'sse',
                url: fullSessionUrl,
                eventSource: null,
            };

            server.status = 'connected';
            logger.info('SSE MCP server connected', {
                name: server.name,
                baseUrl: config.url,
                sessionUrl: fullSessionUrl
            });
        } catch (error) {
            server.status = 'error';
            server.lastError = error instanceof Error ? error.message : String(error);
            logger.error('Failed to connect to SSE MCP server', {
                name: server.name,
                url: config.url,
                error: server.lastError
            });
            throw error;
        }
    }

    /**
     * Send request to SSE MCP server
     */
    async sendRequest(server: MCPServer, request: MCPRequest, timeoutMs: number = 10000): Promise<MCPResponse> {
        if (!server.connection || server.status !== 'connected') {
            throw new Error(`Server ${server.name} is not connected`);
        }

        logger.debug('Sending MCP request', {
            serverName: server.name,
            method: request.method,
            id: request.id,
            timeout: timeoutMs
        });

        return new Promise(async (resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Request timed out after ${timeoutMs}ms`));
            }, timeoutMs);

            let sseReader: ReadableStreamDefaultReader<any> | null = null;

            try {
                // Start listening for the response via SSE
                const sseResponse = await fetch(server.connection!.url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                        ...server.config.headers,
                    },
                });

                if (!sseResponse.ok) {
                    clearTimeout(timeoutId);
                    reject(new Error(`SSE connection failed: HTTP ${sseResponse.status}: ${sseResponse.statusText}`));
                    return;
                }

                const responseBody = sseResponse.body;
                if (!responseBody) {
                    clearTimeout(timeoutId);
                    reject(new Error('Failed to get SSE response body'));
                    return;
                }

                sseReader = responseBody.getReader();

                const decoder = new TextDecoder();
                let responseReceived = false;

                // Function to read SSE stream
                const readStream = async () => {
                    try {
                        while (true && sseReader) {
                            const { done, value } = await sseReader.read();
                            if (done) break;

                            const chunk = decoder.decode(value, { stream: true });
                            const lines = chunk.split('\n');

                            for (const line of lines) {
                                if (line.startsWith('data: ')) {
                                    const data = line.substring(6).trim();
                                    if (data && data !== '[DONE]') {
                                        try {
                                            const jsonData = JSON.parse(data) as MCPResponse;
                                            if (jsonData.id === request.id) {
                                                clearTimeout(timeoutId);
                                                responseReceived = true;
                                                sseReader?.releaseLock();
                                                
                                                logger.debug('MCP request completed', {
                                                    serverName: server.name,
                                                    method: request.method,
                                                    id: request.id,
                                                    hasError: !!jsonData.error
                                                });
                                                
                                                if (jsonData.error) {
                                                    reject(new Error(`MCP Error: ${jsonData.error.message}`));
                                                } else {
                                                    resolve(jsonData);
                                                }
                                                return;
                                            }
                                        } catch (parseError) {
                                            // Ignore non-JSON data or responses for other requests
                                            logger.debug('Ignoring non-JSON SSE data', { data });
                                        }
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        if (!responseReceived) {
                            clearTimeout(timeoutId);
                            sseReader?.releaseLock();
                            reject(error);
                        }
                    }
                };

                // Start reading the stream
                readStream();

                // Send the actual request
                const postResponse = await fetch(server.connection!.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...server.config.headers,
                    },
                    body: JSON.stringify(request),
                });

                if (!postResponse.ok) {
                    clearTimeout(timeoutId);
                    sseReader?.releaseLock();
                    reject(new Error(`HTTP ${postResponse.status}: ${postResponse.statusText}`));
                    return;
                }

                // The POST should return "Accepted" - we ignore this and wait for SSE response
                const postText = await postResponse.text();
                logger.debug('POST request accepted', {
                    serverName: server.name,
                    method: request.method,
                    response: postText
                });

            } catch (error) {
                clearTimeout(timeoutId);
                sseReader?.releaseLock();
                logger.error('Failed to send request to MCP server', {
                    serverName: server.name,
                    method: request.method,
                    error: error instanceof Error ? error.message : String(error),
                });
                reject(error);
            }
        });
    }

    /**
     * Disconnect from server
     */
    disconnect(server: MCPServer): void {
        if (server.connection?.eventSource) {
            server.connection.eventSource.close();
        }
        
        delete server.connection;
        server.status = 'disconnected';
        logger.info('Disconnected from MCP server', { name: server.name });
    }
}