import cn from 'bem-cn-lite';

import {CircularProgressBar} from '../../../../../../components/CircularProgressBar/CircularProgressBar';
import {DiagnosticCard} from '../../../../../../components/DiagnosticCard/DiagnosticCard';
import {formatUsage} from '../../../../../../store/reducers/tenants/utils';
import type {EMetricStatus} from '../../../../../../store/reducers/tenants/types';

import i18n from '../../i18n';

import './MetricCard.scss';

const b = cn('metrics-card');

interface MetricCardProps {
    selected?: boolean;
    progress?: number;
    label?: string;
    status?: EMetricStatus;
    resourcesUsed?: string;
}

export function MetricCard({selected, progress, label, status, resourcesUsed}: MetricCardProps) {
    const renderContent = () => {
        return (
            <div className={b('content', {selected})}>
                {progress ? (
                    <div className={b('progress')}>{formatUsage(progress)}</div>
                ) : (
                    i18n('no-data')
                )}
                <div className={b('resources')}>{resourcesUsed}</div>
            </div>
        );
    };
    return (
        <DiagnosticCard className={b()} selected={selected}>
            <div className={b('header')}>{label && <div className={b('label')}>{label}</div>}</div>
            <CircularProgressBar
                size={172}
                strokeWidth={11}
                progress={progress || 0}
                content={renderContent()}
                selected={selected}
                status={status}
            />
        </DiagnosticCard>
    );
}
