import type {ReactNode} from 'react';
import cn from 'bem-cn-lite';

import {Card} from '@gravity-ui/uikit';

import './DiagnosticCard.scss';

const b = cn('ydb-diagnostic-card');

interface DiagnosticCardProps {
    children?: ReactNode;
    className?: string;
    active?: boolean;
}

export function DiagnosticCard({children, className, active}: DiagnosticCardProps) {
    return (
        <Card view="clear" className={b({active}, className)}>
            {children}
        </Card>
    );
}
