import {Card, Flex} from '@gravity-ui/uikit';

import {DoughnutMetrics} from '../../../../../components/DoughnutMetrics/DoughnutMetrics';
import {getDiagramValues} from '../../../../../containers/Cluster/ClusterOverview/utils';
import {cn} from '../../../../../utils/cn';
import {
    formatCoresLegend,
    formatStorageLegend,
} from '../../../../../utils/metrics/formatMetricLegend';

import './TabCard.scss';

const b = cn('tenant-tab-card');

interface TabCardProps {
    label: string;
    sublabel?: string;
    value: number;
    limit: number;
    unit: 'bytes' | 'cores';
    active?: boolean;
    helpText?: string;
    clickable?: boolean;
}

export function TabCard({
    label,
    sublabel,
    value,
    limit,
    unit,
    active,
    helpText,
    clickable = true,
}: TabCardProps) {
    const legendFormatter = unit === 'bytes' ? formatStorageLegend : formatCoresLegend;

    const {status, percents, legend, fill} = getDiagramValues({
        value,
        capacity: limit,
        legendFormatter,
    });

    return (
        <div className={b({active})}>
            <Card
                className={b('card-container', {active, clickable})}
                type="container"
                view={active ? 'outlined' : 'raised'}
            >
                <Flex gap={3} alignItems="center">
                    <DoughnutMetrics
                        size="small"
                        status={status}
                        fillWidth={fill}
                        className={b('doughnut')}
                    >
                        <DoughnutMetrics.Value variant="subheader-1">
                            {percents}
                        </DoughnutMetrics.Value>
                    </DoughnutMetrics>
                    <div className={b('legend-wrapper')}>
                        <DoughnutMetrics.Legend variant="subheader-2">
                            {legend}
                        </DoughnutMetrics.Legend>
                        <DoughnutMetrics.Legend
                            variant="body-1"
                            color="secondary"
                            note={helpText}
                            noteIconSize="s"
                        >
                            {sublabel || label}
                        </DoughnutMetrics.Legend>
                    </div>
                </Flex>
            </Card>
        </div>
    );
}
