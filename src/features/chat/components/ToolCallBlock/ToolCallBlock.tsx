import {Loader} from '../../../../components/Loader/Loader';
import {useToolCallTimer} from '../../hooks/useToolCallTimer';

import './ToolCallBlock.scss';

interface ToolCall {
    id: string;
    function: {
        name: string;
        arguments: string;
    };
    status?: 'pending' | 'executing' | 'completed' | 'error';
    startTime?: number;
    endTime?: number;
}

interface ToolCallItemProps {
    toolCall: ToolCall;
}

const ToolCallItem = ({toolCall}: ToolCallItemProps) => {
    const duration = useToolCallTimer(toolCall.startTime, toolCall.endTime);

    const safeParseJSON = (jsonString: string) => {
        try {
            if (!jsonString || jsonString.trim() === '') {
                return {};
            }
            return JSON.parse(jsonString);
        } catch {
            return {};
        }
    };

    const formatToolName = (name: string | undefined) => {
        if (!name) {
            return 'unknown-tool';
        }
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

    const renderStatus = (toolCall: ToolCall) => {
        switch (toolCall.status) {
            case 'pending':
                return <span className="tool-call-block__status">⏳</span>;
            case 'executing':
                return <Loader size="s" className="tool-call-block__loader" />;
            case 'completed':
                return <span className="tool-call-block__status">✅</span>;
            case 'error':
                return <span className="tool-call-block__status">❌</span>;
            default:
                return null;
        }
    };

    if (!toolCall.function) {
        return null;
    }

    const parsedArgs = safeParseJSON(toolCall.function.arguments || '{}');
    const toolName = formatToolName(toolCall.function.name);
    const params = formatParams(parsedArgs);

    return (
        <div className="tool-call-block__item">
            <span className="tool-call-block__content">
                🔧{' '}
                <code>
                    {toolName}
                    {params}
                </code>
            </span>
            <span className="tool-call-block__duration">{duration}</span>
            {renderStatus(toolCall)}
        </div>
    );
};

interface ToolCallBlockProps {
    toolCalls: ToolCall[];
}

export const ToolCallBlock = ({toolCalls}: ToolCallBlockProps) => {
    return (
        <div className="tool-call-block">
            {toolCalls.map((toolCall) => (
                <ToolCallItem key={toolCall.id} toolCall={toolCall} />
            ))}
        </div>
    );
};
