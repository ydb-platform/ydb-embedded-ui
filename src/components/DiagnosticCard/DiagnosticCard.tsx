import {ReactNode} from 'react';
import cn from 'bem-cn-lite';

import {Card} from '@gravity-ui/uikit';

import './DiagnosticCard.scss';

const b = cn('diagnostic-card');

interface DiagnosticCardProps {
    children?: ReactNode;
    className?: string;
}

export function DiagnosticCard({children, className}: DiagnosticCardProps) {
    return <Card className={b(null, className)}>{children}</Card>;
}
