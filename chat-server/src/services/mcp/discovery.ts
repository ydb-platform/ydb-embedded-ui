import { logger } from '../../utils/logger';
import { MCPServer } from './types';
import { MCPTool, MCPResource } from '../../types/mcp';
import { SSEConnectionManager } from './connection';

export class ToolDiscoveryManager {
    private connectionManager: SSEConnectionManager;

    constructor(connectionManager: SSEConnectionManager) {
        this.connectionManager = connectionManager;
    }

    /**
     * Initialize server after connection
     */
    async initializeServer(server: MCPServer): Promise<void> {
        try {
            logger.info('Initializing MCP server', { name: server.name });

            // Send initialize request
            logger.debug('Sending initialize request', { name: server.name });
            const initResponse = await this.connectionManager.sendRequest(server, {
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
            }, 10000);

            logger.info('Server initialization response', {
                name: server.name,
                capabilities: initResponse.result?.capabilities
            });

            // Send initialized notification
            logger.debug('Sending initialized notification', { name: server.name });
            await this.connectionManager.sendRequest(server, {
                jsonrpc: '2.0',
                id: 'initialized',
                method: 'notifications/initialized',
                params: {},
            }, 5000);

            logger.debug('Initialized notification sent', { name: server.name });

            // Discover tools and resources
            logger.debug('Starting tool and resource discovery', { name: server.name });
            await this.discoverTools(server);
            await this.discoverResources(server);

            logger.info('Server initialized successfully', {
                name: server.name,
                toolCount: server.tools?.length || 0,
                resourceCount: server.resources?.length || 0
            });
        } catch (error) {
            server.status = 'error';
            server.lastError = error instanceof Error ? error.message : String(error);
            logger.error('Failed to initialize server', {
                name: server.name,
                error: server.lastError,
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }

    /**
     * Discover available tools
     */
    private async discoverTools(server: MCPServer): Promise<void> {
        try {
            logger.debug('Requesting tools list', { serverName: server.name });
            const response = await this.connectionManager.sendRequest(server, {
                jsonrpc: '2.0',
                id: 'list-tools',
                method: 'tools/list',
                params: {},
            }, 10000);

            logger.debug('Tools list response received', {
                serverName: server.name,
                hasResult: !!response.result,
                hasTools: !!response.result?.tools
            });

            if (response.result?.tools) {
                server.tools = response.result.tools as MCPTool[];
                logger.info('Tools discovered', {
                    serverName: server.name,
                    toolCount: server.tools.length,
                    tools: server.tools.map(t => t.name)
                });
            } else {
                server.tools = [];
                logger.warn('No tools found in response', {
                    serverName: server.name,
                    response: response.result
                });
            }
        } catch (error) {
            logger.error('Failed to discover tools', {
                serverName: server.name,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            server.tools = [];
        }
    }

    /**
     * Discover available resources
     */
    private async discoverResources(server: MCPServer): Promise<void> {
        try {
            logger.debug('Requesting resources list', { serverName: server.name });
            const response = await this.connectionManager.sendRequest(server, {
                jsonrpc: '2.0',
                id: 'list-resources',
                method: 'resources/list',
                params: {},
            }, 10000);

            logger.debug('Resources list response received', {
                serverName: server.name,
                hasResult: !!response.result,
                hasResources: !!response.result?.resources
            });

            if (response.result?.resources) {
                server.resources = response.result.resources as MCPResource[];
                logger.info('Resources discovered', {
                    serverName: server.name,
                    resourceCount: server.resources.length
                });
            } else {
                server.resources = [];
                logger.info('No resources found', {
                    serverName: server.name,
                    response: response.result
                });
            }
        } catch (error) {
            logger.error('Failed to discover resources', {
                serverName: server.name,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            server.resources = [];
        }
    }
}