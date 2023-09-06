import cn from 'bem-cn-lite';

import {CircularProgressBar} from '../../../../../../components/CircularProgressBar/CircularProgressBar';
import {DiagnosticCard} from '../../../../../../components/DiagnosticCard/DiagnosticCard';
import {formatUsage} from '../../../../../../store/reducers/tenants/utils';
import type {MetricStatus} from '../../../../../../store/reducers/tenants/types';

import i18n from '../../i18n';

import './MetricCard.scss';

const b = cn('ydb-metrics-card');

interface MetricCardProps {
    active?: boolean;
    progress?: number;
    label?: string;
    status?: MetricStatus;
    resourcesUsed?: string;
}

export function MetricCard({active, progress, label, status, resourcesUsed}: MetricCardProps) {
    const renderContent = () => {
        return (
            <div className={b('content')}>
                {progress && <div className={b('progress')}>{formatUsage(progress)}</div>}
                {resourcesUsed ? (
                    <div className={b('resources')}>{resourcesUsed}</div>
                ) : (
                    i18n('no-data')
                )}
            </div>
        );
    };
    return (
        <DiagnosticCard className={b({active})} active={active}>
            <div className={b('header')}>{label && <div className={b('label')}>{label}</div>}</div>
            <CircularProgressBar
                size={172}
                strokeWidth={11}
                progress={progress || 0}
                content={renderContent()}
                status={status}
                circleBgClassName={b('progress-bar-circle-bg')}
            />
        </DiagnosticCard>
    );
}
