import {CircleDollar} from '@gravity-ui/icons';
import {Icon, Label} from '@gravity-ui/uikit';

import {cn} from '../../../../utils/cn';
import type {UsageBreakdown} from '../../types/chat';

import './UsageDisplay.scss';

const b = cn('ydb-usage-display');

interface UsageDisplayProps {
    usage: UsageBreakdown;
    className?: string;
}

export const UsageDisplay = ({usage, className}: UsageDisplayProps) => {
    const formatCost = (cost: number) => {
        if (cost < 0.001) {
            return '<$0.001';
        }
        return `$${cost.toFixed(4)}`;
    };

    const formatTokens = (tokens: number) => {
        if (tokens >= 1000) {
            return `${(tokens / 1000).toFixed(1)}K`;
        }
        return tokens.toString();
    };

    return (
        <div className={b(null, className)}>
            <div className={b('content')}>
                <Icon data={CircleDollar} size={12} />
                <Label theme="normal" size="xs">
                    {formatTokens(usage.totalTokens)} tokens • {formatCost(usage.estimatedCost)}
                </Label>
            </div>
        </div>
    );
};
