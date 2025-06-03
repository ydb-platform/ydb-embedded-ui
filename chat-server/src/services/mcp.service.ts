import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import { createComponentLogger } from '../utils/logger';
import { MCPConnectionError } from '../utils/errors';
import {
    MCPServer,
    MCPServerConfig,
    MCPRequest,
    MCPResponse,
    MCPTool,
    MCPToolResult
} from '../types/mcp';

const logger = createComponentLogger('MCPService');

export class MCPService extends EventEmitter {
    private servers: Map<string, MCPServer> = new Map();
    private connectionRetries: Map<string, number> = new Map();
    private readonly maxRetries = 3;
    private readonly retryDelay = 5000; // 5 seconds

    constructor() {
        super();
        logger.info('MCP service initialized');
    }

    /**
     * Register a new MCP server
     */
    async registerServer(config: MCPServerConfig): Promise<void> {
        const server: MCPServer = {
            id: config.name,
            name: config.name,
            type: config.type,
            config,
            status: 'disconnected',
            connection: null,
            lastHeartbeat: null,
            tools: [],
            resources: [],
            capabilities: {
                tools: false,
                resources: false,
                prompts: false,
            },
        };

        this.servers.set(config.name, server);
        logger.info('MCP server registered', { name: config.name, type: config.type });

        // Attempt to connect
        try {
            await this.connectServer(config.name);
        } catch (error) {
            logger.warn('Initial connection failed, will retry', { name: config.name, error });
        }
    }

    /**
     * Connect to an MCP server
     */
    async connectServer(serverName: string): Promise<void> {
        const server = this.servers.get(serverName);
        if (!server) {
            throw new MCPConnectionError(`Server ${serverName} not found`);
        }

        try {
            logger.info('Connecting to MCP server', { name: serverName, type: server.config.type });

            if (server.config.type === 'stdio') {
                await this.connectStdioServer(server);
            } else if (server.config.type === 'sse') {
                await this.connectSSEServer(server);
            } else {
                throw new Error(`Unsupported server type: ${server.config.type}`);
            }

            server.status = 'connected';
            server.lastHeartbeat = Date.now();
            this.connectionRetries.delete(serverName);

            // Initialize the server
            await this.initializeServer(server);

            this.emit('serverConnected', server);
            logger.info('MCP server connected successfully', { name: serverName });

        } catch (error) {
            logger.error('Failed to connect to MCP server', { name: serverName, error });
            await this.handleConnectionError(serverName, error as Error);
            throw error;
        }
    }

    /**
     * Connect to a stdio-based MCP server
     */
    private async connectStdioServer(server: MCPServer): Promise<void> {
        const config = server.config;
        if (!config.command) {
            throw new Error('Command is required for stdio servers');
        }

        const childProcess = spawn(config.command, config.args || [], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, ...config.env },
            cwd: config.cwd,
        });

        server.connection = {
            type: 'stdio',
            process: childProcess,
        };

        // Handle process events
        childProcess.on('error', (error: Error) => {
            logger.error('MCP server process error', { name: server.name, error });
            this.handleConnectionError(server.name, error);
        });

        childProcess.on('exit', (code: number | null, signal: string | null) => {
            logger.warn('MCP server process exited', { name: server.name, code, signal });
            server.status = 'disconnected';
            this.emit('serverDisconnected', server);
        });
    }

    /**
     * Connect to an SSE-based MCP server
     */
    private async connectSSEServer(server: MCPServer): Promise<void> {
        const config = server.config;
        if (!config.url) {
            throw new Error('URL is required for SSE servers');
        }

        // For now, we'll simulate SSE connection
        // In a real implementation, you'd use EventSource or similar
        server.connection = {
            type: 'sse',
            url: config.url,
            eventSource: null, // Would be actual EventSource instance
        };
    }

    /**
     * Initialize server after connection
     */
    private async initializeServer(server: MCPServer): Promise<void> {
        try {
            // Send initialize request
            const initResponse = await this.sendRequest(server.name, {
                jsonrpc: '2.0',
                id: 'init',
                method: 'initialize',
                params: {
                    protocolVersion: '2024-11-05',
                    capabilities: {
                        roots: {
                            listChanged: true,
                        },
                        sampling: {},
                    },
                    clientInfo: {
                        name: 'ydb-embedded-ui-chat-server',
                        version: '1.0.0',
                    },
                },
            });

            if (initResponse.error) {
                throw new Error(`Initialization failed: ${initResponse.error.message}`);
            }

            logger.info('MCP server initialized', { name: server.name });

            // Discover tools and resources
            try {
                await this.discoverTools(server);
            } catch (error) {
                logger.warn('Failed to discover tools', { serverName: server.name, error });
            }

            try {
                await this.discoverResources(server);
            } catch (error) {
                logger.warn('Failed to discover resources', { serverName: server.name, error });
            }

        } catch (error) {
            logger.error('Server initialization failed', { name: server.name, error });
            throw error;
        }
    }

    /**
     * Call a tool on a specific MCP server
     */
    async callTool(serverId: string, toolName: string, args: any): Promise<MCPToolResult> {
        const server = this.servers.get(serverId);
        if (!server) {
            throw new Error(`MCP server '${serverId}' not found`);
        }

        try {
            const result = await this.executeTool(serverId, toolName, args);
            logger.info('Tool called successfully', { serverId, toolName });
            return result;
        } catch (error) {
            logger.error('Tool call failed', { serverId, toolName, error });
            throw error;
        }
    }

    /**
     * Get all available tools from all servers
     */
    getAllTools(): Array<MCPTool & { serverName: string }> {
        const tools: Array<MCPTool & { serverName: string }> = [];
        
        for (const [serverName, server] of this.servers) {
            if (server.status === 'connected' && server.tools) {
                for (const tool of server.tools) {
                    tools.push({
                        ...tool,
                        serverName,
                    });
                }
            }
        }

        return tools;
    }

    /**
     * Get all available resources from all servers
     */
    getAllResources(): Array<{ uri: string; name: string; serverName: string }> {
        const resources: Array<{ uri: string; name: string; serverName: string }> = [];
        
        for (const [serverName, server] of this.servers) {
            if (server.status === 'connected' && server.resources) {
                for (const resource of server.resources) {
                    resources.push({
                        uri: resource.uri,
                        name: resource.name,
                        serverName,
                    });
                }
            }
        }

        return resources;
    }

    /**
     * Health check for all MCP servers
     */
    async healthCheck(): Promise<{ [serverName: string]: { status: string; lastHeartbeat: number | null } }> {
        const health: { [serverName: string]: { status: string; lastHeartbeat: number | null } } = {};
        
        for (const [serverName, server] of this.servers) {
            health[serverName] = {
                status: server.status,
                lastHeartbeat: server.lastHeartbeat,
            };
        }

        return health;
    }

    /**
     * Discover tools from a server
     */
    private async discoverTools(server: MCPServer): Promise<void> {
        try {
            const response = await this.sendRequest(server.name, {
                jsonrpc: '2.0',
                id: 'tools_list',
                method: 'tools/list',
                params: {},
            });

            if (response.error) {
                throw new Error(`Tools discovery failed: ${response.error.message}`);
            }

            server.tools = response.result?.tools || [];
            logger.info('Tools discovered', {
                serverName: server.name, 
                toolsCount: server.tools.length,
                tools: server.tools.map(t => t.name),
            });
        } catch (error) {
            logger.warn('Failed to discover tools', { serverName: server.name, error });
        }
    }

    /**
     * Discover resources from a server
     */
    private async discoverResources(server: MCPServer): Promise<void> {
        try {
            const response = await this.sendRequest(server.name, {
                jsonrpc: '2.0',
                id: 'resources_list',
                method: 'resources/list',
                params: {},
            });

            if (response.error) {
                throw new Error(`Resources discovery failed: ${response.error.message}`);
            }

            server.resources = response.result?.resources || [];
            logger.info('Resources discovered', {
                serverName: server.name, 
                resourcesCount: server.resources.length,
                resources: server.resources.map(r => r.uri),
            });
        } catch (error) {
            logger.warn('Failed to discover resources', { serverName: server.name, error });
        }
    }

    /**
     * Send a request to an MCP server
     */
    private async sendRequest(serverName: string, request: MCPRequest): Promise<MCPResponse> {
        const server = this.servers.get(serverName);
        if (!server) {
            throw new MCPConnectionError(`Server ${serverName} not found`);
        }

        if (server.status !== 'connected') {
            throw new MCPConnectionError(`Server ${serverName} is not connected`);
        }

        try {
            logger.debug('Sending MCP request', {
                serverName, 
                method: request.method,
                id: request.id,
            });

            // For now, simulate the response
            // In a real implementation, you'd send the request via the appropriate transport
            const response: MCPResponse = {
                jsonrpc: '2.0',
                id: request.id || `req_${Date.now()}`,
                result: await this.simulateMethodCall(server, request),
            };

            logger.debug('MCP request completed', {
                serverName, 
                requestId: request.id,
                success: !response.error,
            });

            return response;
        } catch (error) {
            logger.error('MCP request failed', { serverName, method: request.method, error });
            return {
                jsonrpc: '2.0',
                id: request.id || `req_${Date.now()}`,
                error: {
                    code: -32603,
                    message: error instanceof Error ? error.message : 'Internal error',
                },
            };
        }
    }

    /**
     * Simulate method calls for development/testing
     */
    private async simulateMethodCall(server: MCPServer, request: MCPRequest): Promise<any> {
        // This is a simulation for development purposes
        // In a real implementation, this would send actual requests to MCP servers
        
        switch (request.method) {
            case 'initialize':
                return {
                    protocolVersion: '2024-11-05',
                    capabilities: {
                        logging: {},
                        tools: {
                            listChanged: true,
                        },
                        resources: {
                            subscribe: true,
                            listChanged: true,
                        },
                    },
                    serverInfo: {
                        name: server.name,
                        version: '1.0.0',
                    },
                };

            case 'tools/list':
                return {
                    tools: [
                        {
                            name: 'example_tool',
                            description: 'An example tool for demonstration',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    message: { type: 'string' },
                                },
                                required: ['message'],
                            },
                        },
                    ],
                };

            case 'resources/list':
                return {
                    resources: [
                        {
                            uri: 'file://example.txt',
                            name: 'Example Resource',
                            description: 'An example resource',
                            mimeType: 'text/plain',
                        },
                    ],
                };

            case 'tools/call':
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Tool executed with arguments: ${JSON.stringify(request.params)}`,
                        },
                    ],
                };

            case 'resources/read':
                return {
                    contents: [
                        {
                            uri: request.params?.uri,
                            mimeType: 'text/plain',
                            text: 'Example resource content',
                        },
                    ],
                };

            default:
                throw new Error(`Unsupported method: ${request.method}`);
        }
    }

    /**
     * Execute a tool on an MCP server
     */
    async executeTool(serverName: string, toolName: string, arguments_: any): Promise<any> {
        try {
            logger.info('Executing MCP tool', { serverName, toolName, arguments: arguments_ });

            const response = await this.sendRequest(serverName, {
                jsonrpc: '2.0',
                id: `tool_${Date.now()}`,
                method: 'tools/call',
                params: {
                    name: toolName,
                    arguments: arguments_,
                },
            });

            if (response.error) {
                throw new Error(`Tool execution failed: ${response.error.message}`);
            }

            logger.info('Tool executed successfully', { serverName, toolName });
            return response.result;
        } catch (error) {
            logger.error('Tool execution failed', { serverName, toolName, error });
            throw error;
        }
    }

    /**
     * Read a resource from an MCP server
     */
    async readResource(serverName: string, uri: string): Promise<any> {
        try {
            logger.info('Reading MCP resource', { serverName, uri });

            const response = await this.sendRequest(serverName, {
                jsonrpc: '2.0',
                id: `resource_${Date.now()}`,
                method: 'resources/read',
                params: { uri },
            });

            if (response.error) {
                throw new Error(`Resource read failed: ${response.error.message}`);
            }

            logger.info('Resource read successfully', { serverName, uri });
            return response.result;
        } catch (error) {
            logger.error('Resource read failed', { serverName, uri, error });
            throw error;
        }
    }

    /**
     * Handle connection errors with retry logic
     */
    private async handleConnectionError(serverName: string, error: Error): Promise<void> {
        const server = this.servers.get(serverName);
        if (!server) return;

        server.status = 'error';
        const retryCount = this.connectionRetries.get(serverName) || 0;

        if (retryCount < this.maxRetries) {
            this.connectionRetries.set(serverName, retryCount + 1);
            logger.warn('Connection failed, scheduling retry', {
                serverName, 
                retryCount: retryCount + 1, 
                maxRetries: this.maxRetries,
                error: error.message,
            });

            setTimeout(() => {
                this.connectServer(serverName).catch(err => {
                    logger.error('Retry connection failed', { serverName, error: err });
                });
            }, this.retryDelay * Math.pow(2, retryCount)); // Exponential backoff
        } else {
            logger.error('Max retries exceeded, giving up', {
                serverName, 
                retryCount, 
                error: error.message,
            });
            this.emit('serverError', server, error);
        }
    }

    /**
     * Get all registered servers
     */
    getServers(): MCPServer[] {
        return Array.from(this.servers.values());
    }

    /**
     * Get a specific server by name
     */
    getServer(name: string): MCPServer | undefined {
        return this.servers.get(name);
    }

    /**
     * Disconnect from an MCP server
     */
    async disconnectServer(serverName: string): Promise<void> {
        const server = this.servers.get(serverName);
        if (!server) return;

        try {
            logger.info('Disconnecting from MCP server', { name: serverName });

            // Close connection based on type
            if (server.connection?.type === 'stdio' && server.connection.process) {
                server.connection.process.kill();
            } else if (server.connection?.type === 'sse' && server.connection.eventSource) {
                server.connection.eventSource.close();
            }

            server.status = 'disconnected';
            server.connection = null;
            server.lastHeartbeat = null;

            this.emit('serverDisconnected', server);
            logger.info('MCP server disconnected', { name: serverName });
        } catch (error) {
            logger.error('Failed to disconnect from MCP server', { name: serverName, error });
        }
    }

    /**
     * Unregister and disconnect from an MCP server
     */
    async unregisterServer(serverName: string): Promise<void> {
        await this.disconnectServer(serverName);
        this.servers.delete(serverName);
        this.connectionRetries.delete(serverName);

        logger.info('MCP server unregistered', { name: serverName });
        this.emit('serverUnregistered', serverName);
    }
}

// Export singleton instance
let mcpServiceInstance: MCPService | null = null;

export function getMCPService(): MCPService {
    if (!mcpServiceInstance) {
        mcpServiceInstance = new MCPService();
    }
    return mcpServiceInstance;
}