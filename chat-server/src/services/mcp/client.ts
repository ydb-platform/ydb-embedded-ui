import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { logger } from '../../utils/logger';
import { MCPServer, MCPServerConfig } from './types';

export class MCPClient {
    private clients: Map<string, Client> = new Map();

    /**
     * Connect to an SSE MCP server
     */
    async connect(server: MCPServer, config: MCPServerConfig): Promise<void> {
        if (server.status === 'connected') {
            logger.warn('Server already connected', { name: server.name });
            return;
        }

        server.status = 'connecting';
        logger.info('Connecting to SSE MCP server', { 
            name: server.name, 
            url: config.url
        });

        try {
            const transport = new SSEClientTransport(new URL(config.url));
            
            const client = new Client({
                name: 'ydb-chat-server',
                version: '1.0.0',
            });

            await client.connect(transport);
            
            this.clients.set(server.name, client);
            server.status = 'connected';
            
            logger.info('SSE MCP server connected successfully', {
                name: server.name,
                url: config.url
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
     * Get available tools from a server
     */
    async getTools(serverName: string): Promise<any[]> {
        const client = this.clients.get(serverName);
        if (!client) {
            throw new Error(`Server ${serverName} is not connected`);
        }

        try {
            const response = await client.listTools();
            return response.tools || [];
        } catch (error) {
            logger.error('Failed to get tools from MCP server', {
                serverName,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    /**
     * Get available resources from a server
     */
    async getResources(serverName: string): Promise<any[]> {
        const client = this.clients.get(serverName);
        if (!client) {
            throw new Error(`Server ${serverName} is not connected`);
        }

        try {
            const response = await client.listResources();
            return response.resources || [];
        } catch (error) {
            logger.error('Failed to get resources from MCP server', {
                serverName,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    /**
     * Call a tool on an MCP server
     */
    async callTool(serverName: string, toolName: string, arguments_: any): Promise<any> {
        const client = this.clients.get(serverName);
        if (!client) {
            throw new Error(`Server ${serverName} is not connected`);
        }

        logger.debug('Calling MCP tool', {
            serverName,
            toolName,
            arguments: arguments_
        });

        try {
            const response = await client.callTool({
                name: toolName,
                arguments: arguments_
            });

            logger.debug('MCP tool call completed', {
                serverName,
                toolName,
                hasContent: !!(response.content && Array.isArray(response.content) && response.content.length > 0)
            });

            return response;
        } catch (error) {
            logger.error('Failed to call MCP tool', {
                serverName,
                toolName,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    /**
     * Read a resource from an MCP server
     */
    async readResource(serverName: string, uri: string): Promise<any> {
        const client = this.clients.get(serverName);
        if (!client) {
            throw new Error(`Server ${serverName} is not connected`);
        }

        logger.debug('Reading MCP resource', {
            serverName,
            uri
        });

        try {
            const response = await client.readResource({ uri });

            logger.debug('MCP resource read completed', {
                serverName,
                uri,
                hasContent: !!(response.contents && response.contents.length > 0)
            });

            return response;
        } catch (error) {
            logger.error('Failed to read MCP resource', {
                serverName,
                uri,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    /**
     * Disconnect from a server
     */
    async disconnect(serverName: string): Promise<void> {
        const client = this.clients.get(serverName);
        if (client) {
            try {
                await client.close();
                this.clients.delete(serverName);
                logger.info('Disconnected from MCP server', { name: serverName });
            } catch (error) {
                logger.error('Error disconnecting from MCP server', {
                    name: serverName,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
    }

    /**
     * Disconnect from all servers
     */
    async disconnectAll(): Promise<void> {
        const disconnectPromises = Array.from(this.clients.keys()).map(serverName => 
            this.disconnect(serverName)
        );
        await Promise.all(disconnectPromises);
    }
}