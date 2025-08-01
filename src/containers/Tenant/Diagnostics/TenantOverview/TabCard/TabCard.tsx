import {Card, Flex} from '@gravity-ui/uikit';

import {DoughnutMetrics} from '../../../../../components/DoughnutMetrics/DoughnutMetrics';
import {getDiagramValues} from '../../../../../containers/Cluster/ClusterOverview/utils';
import {cn} from '../../../../../utils/cn';

import './TabCard.scss';

const b = cn('tenant-tab-card');

interface TabCardProps {
    text: string;
    value: number;
    limit: number;
    active?: boolean;
    helpText?: string;
    legendFormatter: (params: {value: number; capacity: number}) => string;
}

export function TabCard({text, value, limit, active, helpText, legendFormatter}: TabCardProps) {
    const {status, percents, legend, fill} = getDiagramValues({
        value,
        capacity: limit,
        legendFormatter,
    });

    return (
        <div className={b({active})}>
            <Card
                className={b('card-container', {active})}
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
                            {text}
                        </DoughnutMetrics.Legend>
                    </div>
                </Flex>
            </Card>
        </div>
    );
}
