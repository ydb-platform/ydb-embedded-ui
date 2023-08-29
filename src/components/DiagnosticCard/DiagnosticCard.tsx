import type {ReactNode} from 'react';
import cn from 'bem-cn-lite';

import {Card} from '@gravity-ui/uikit';

import './DiagnosticCard.scss';

const b = cn('diagnostic-card');

interface DiagnosticCardProps {
    children?: ReactNode;
    className?: string;
    selected?: boolean;
}

export function DiagnosticCard({children, className, selected}: DiagnosticCardProps) {
    return (
        <Card view="clear" className={b({selected}, className)}>
            {children}
        </Card>
    );
}
