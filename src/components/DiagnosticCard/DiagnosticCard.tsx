import {cn} from '../../utils/cn';

import './DiagnosticCard.scss';

const b = cn('ydb-diagnostic-card');

export interface DiagnosticCardProps {
    children?: React.ReactNode;
    className?: string;
    active?: boolean;
    size?: 'm' | 'l' | 's';
    interactive?: boolean;
}

export function DiagnosticCard({
    children,
    className,
    active,
    size = 'm',
    interactive = true,
}: DiagnosticCardProps) {
    return <div className={b({active, size, interactive}, className)}>{children}</div>;
}
