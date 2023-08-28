import {ReactNode} from 'react';
import cn from 'bem-cn-lite';

import {CircularProgressBar} from '../../../../../../components/CircularProgressBar/CircularProgressBar';
import {DiagnosticCard} from '../../../../../../components/DiagnosticCard/DiagnosticCard';

import './MetricCard.scss';

const b = cn('metric-card');

interface MetricCardProps {
    isSelected?: boolean;
    onClick?: () => void;
    children?: ReactNode;
    progress?: number | null;
    className?: string;
    label?: string;
    status?: string;
}

export function MetricCard({children, progress, label, isSelected, status}: MetricCardProps) {
    return (
        <DiagnosticCard className={b(null)} selected={isSelected}>
            <div className={b('header')}>{label && <div className={b('label')}>{label}</div>}</div>
            <CircularProgressBar
                size={172}
                strokeWidth={11}
                progress={progress || 0}
                content={children}
                isSelected={isSelected}
                status={status}
            />
        </DiagnosticCard>
    );
}
