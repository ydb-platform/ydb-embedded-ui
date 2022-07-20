import {ReactNode} from 'react';
import cn from 'bem-cn-lite';

const b = cn('kv-node-structure');

interface PDiskTitleBadgeProps {
    label?: string;
    value: ReactNode;
}

export function PDiskTitleBadge({label, value}: PDiskTitleBadgeProps) {
    return (
        <span className={b('pdisk-title-item')}>
            {label && (
                <span className={b('pdisk-title-item-label')}>
                    {label}:
                </span>
            )}
            <span className={b('pdisk-title-item-value')}>
                {value}
            </span>
        </span>
    );
}
