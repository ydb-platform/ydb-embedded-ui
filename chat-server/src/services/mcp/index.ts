import { logger } from '../../utils/logger';
import { MCPTool, MCPResource } from '../../types/mcp';
import { MCPServer, MCPServerConfig } from './types';
import { MCPClient } from './client';

export class MCPService {
    private servers = new Map<string, MCPServer>();
    private client = new MCPClient();

    /**
     * Register a new MCP server
     */
    async registerServer(config: MCPServerConfig): Promise<void> {
        if (this.servers.has(config.name)) {
            throw new Error(`Server ${config.name} is already registered`);
        }

        const server: MCPServer = {
            name: config.name,
            type: config.type,
            config,
            status: 'disconnected',
        };

        this.servers.set(config.name, server);
        logger.info('MCP server registered', { name: config.name, type: config.type });
    }

    /**
     * Connect to a registered server
     */
    async connectServer(name: string): Promise<void> {
        const server = this.servers.get(name);
        if (!server) {
            throw new Error(`Server ${name} is not registered`);
        }

        await this.client.connect(server, server.config);
        
        // Fetch available tools and resources
        try {
            server.tools = await this.client.getTools(name);
            server.resources = await this.client.getResources(name);
            
            logger.debug('Server capabilities loaded', {
                serverName: name,
                toolsCount: server.tools.length,
                resourcesCount: server.resources.length
            });
        } catch (error) {
            logger.error('Failed to load server capabilities', {
                serverName: name,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    /**
     * Disconnect from a server
     */
    async disconnectServer(name: string): Promise<void> {
        const server = this.servers.get(name);
        if (!server) {
            throw new Error(`Server ${name} is not registered`);
        }

        await this.client.disconnect(name);
        server.status = 'disconnected';
        server.tools = [];
        server.resources = [];
    }

    /**
     * Get all available tools from all connected servers
     */
    getAllTools(): Array<MCPTool & { serverName: string }> {
        const tools: Array<MCPTool & { serverName: string }> = [];
        
        logger.debug('Getting all tools', { 
            serverCount: this.servers.size,
            servers: Array.from(this.servers.entries()).map(([name, server]) => ({
                name,
                status: server.status,
                toolCount: server.tools?.length || 0,
                tools: server.tools?.map(t => t.name) || []
            }))
        });
        
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

        logger.info('Retrieved all tools', { 
            totalTools: tools.length,
            toolsByServer: tools.reduce((acc, tool) => {
                acc[tool.serverName] = (acc[tool.serverName] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
            toolNames: tools.map(t => t.name)
        });

        return tools;
    }

    /**
     * Get all available resources from all connected servers
     */
    getAllResources(): Array<MCPResource & { serverName: string }> {
        const resources: Array<MCPResource & { serverName: string }> = [];
        
        for (const [serverName, server] of this.servers) {
            if (server.status === 'connected' && server.resources) {
                for (const resource of server.resources) {
                    resources.push({
                        ...resource,
                        serverName,
                    });
                }
            }
        }

        return resources;
    }

    /**
     * Call a tool on a specific server
     */
    async callTool(serverName: string, toolName: string, arguments_: any): Promise<any> {
        const server = this.servers.get(serverName);
        if (!server) {
            throw new Error(`Server ${serverName} is not registered`);
        }

        if (server.status !== 'connected') {
            throw new Error(`Server ${serverName} is not connected`);
        }

        const tool = server.tools?.find(t => t.name === toolName);
        if (!tool) {
            throw new Error(`Tool ${toolName} not found on server ${serverName}`);
        }

        logger.info('Calling MCP tool', { serverName, toolName, arguments: arguments_ });

        const response = await this.client.callTool(serverName, toolName, arguments_);

        logger.info('Tool call completed', { serverName, toolName });
        return response;
    }

    /**
     * Access a resource on a specific server
     */
    async accessResource(serverName: string, uri: string): Promise<any> {
        const server = this.servers.get(serverName);
        if (!server) {
            throw new Error(`Server ${serverName} is not registered`);
        }

        if (server.status !== 'connected') {
            throw new Error(`Server ${serverName} is not connected`);
        }

        logger.info('Accessing MCP resource', { serverName, uri });

        const response = await this.client.readResource(serverName, uri);

        logger.info('Resource access completed', { serverName, uri });
        return response;
    }

    /**
     * Get server status
     */
    getServerStatus(name: string): string | undefined {
        return this.servers.get(name)?.status;
    }

    /**
     * Get all servers
     */
    getServers(): Array<{ name: string; status: string; toolCount: number; resourceCount: number }> {
        return Array.from(this.servers.entries()).map(([name, server]) => ({
            name,
            status: server.status,
            toolCount: server.tools?.length || 0,
            resourceCount: server.resources?.length || 0,
        }));
    }

    /**
     * Shutdown the service and disconnect all servers
     */
    async shutdown(): Promise<void> {
        logger.info('Shutting down MCP service');
        await this.client.disconnectAll();
        this.servers.clear();
        logger.info('MCP service shut down');
    }
}

// Singleton instance
let mcpServiceInstance: MCPService | null = null;

export function getMCPService(): MCPService {
    if (!mcpServiceInstance) {
        mcpServiceInstance = new MCPService();
    }
    return mcpServiceInstance;
}

export * from './types';