import {DiagnosticCard} from '../../../../../../components/DiagnosticCard/DiagnosticCard';
import {ProgressViewer} from '../../../../../../components/ProgressViewer/ProgressViewer';
import type {ProgressViewerProps} from '../../../../../../components/ProgressViewer/ProgressViewer';
import {StatusIcon} from '../../../../../../components/StatusIcon/StatusIcon';
import type {MetricStatus} from '../../../../../../store/reducers/tenants/types';
import {EFlag} from '../../../../../../types/api/enums';
import {cn} from '../../../../../../utils/cn';

import './MetricCard.scss';

const b = cn('ydb-metrics-card');

const getStatusIcon = (status?: MetricStatus) => {
    let colorStatus: EFlag | undefined;

    if (status === 'Warning') {
        colorStatus = EFlag.Yellow;
    }
    if (status === 'Danger') {
        colorStatus = EFlag.Red;
    }

    if (colorStatus) {
        return <StatusIcon status={colorStatus} mode="icons" size="l" />;
    }

    return null;
};

export interface DiagnosticsCardMetric extends ProgressViewerProps {
    title?: React.ReactNode;
}

interface MetricCardProps {
    active?: boolean;
    label?: string;
    status?: MetricStatus;
    metrics: DiagnosticsCardMetric[];
}

export function MetricCard({active, label, status, metrics}: MetricCardProps) {
    const renderContent = () => {
        return metrics.map(({title, ...progressViewerProps}, index) => {
            return (
                <div key={index} className={b('metric')}>
                    <div className={b('metric-title')}>{title}</div>
                    <ProgressViewer size="xs" colorizeProgress={true} {...progressViewerProps} />
                </div>
            );
        });
    };
    return (
        <DiagnosticCard className={b({active})} active={active}>
            <div className={b('header')}>
                {label && <div className={b('label')}>{label}</div>}
                {getStatusIcon(status)}
            </div>
            <div className={b('content')}>{renderContent()}</div>
        </DiagnosticCard>
    );
}
