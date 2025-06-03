import React from 'react';
import './ToolCallBlock.scss';

interface ToolCall {
    id: string;
    function: {
        name: string;
        arguments: string;
    };
}

interface ToolCallBlockProps {
    toolCalls: ToolCall[];
}

export const ToolCallBlock: React.FC<ToolCallBlockProps> = ({ toolCalls }) => {
    const safeParseJSON = (jsonString: string) => {
        try {
            if (!jsonString || jsonString.trim() === '') {
                return {};
            }
            return JSON.parse(jsonString);
        } catch (error) {
            return {};
        }
    };

    const formatToolName = (name: string | undefined) => {
        if (!name) return 'unknown-tool';
        return name.replace(/^ydb-/, '');
    };

    const formatParams = (args: any) => {
        if (!args || Object.keys(args).length === 0) {
            return '';
        }
        
        const params = Object.entries(args)
            .map(([key, value]) => `${key}="${value}"`)
            .join(' ');
        return ` ${params}`;
    };

    return (
        <div className="tool-call-block">
            {toolCalls.map((toolCall) => {
                if (!toolCall.function) return null;
                
                const parsedArgs = safeParseJSON(toolCall.function.arguments || '{}');
                const toolName = formatToolName(toolCall.function.name);
                const params = formatParams(parsedArgs);
                
                return (
                    <div key={toolCall.id} className="tool-call-block__item">
                        🔧 <code>{toolName}{params}</code>
                    </div>
                );
            })}
        </div>
    );
};
