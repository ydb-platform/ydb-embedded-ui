import {cn} from '../../utils/cn';

import './DiagnosticCard.scss';

const b = cn('ydb-diagnostic-card');

interface DiagnosticCardProps {
    children?: React.ReactNode;
    className?: string;
    active?: boolean;
}

export function DiagnosticCard({children, className, active}: DiagnosticCardProps) {
    return <div className={b({active}, className)}>{children}</div>;
}
