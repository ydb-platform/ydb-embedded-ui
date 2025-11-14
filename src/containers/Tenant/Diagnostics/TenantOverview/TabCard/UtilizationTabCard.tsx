import React from 'react';

import {Card, Flex} from '@gravity-ui/uikit';

import {DoughnutMetrics} from '../../../../../components/DoughnutMetrics/DoughnutMetrics';
import {calculateBaseDiagramValues} from '../../../../../containers/Cluster/ClusterOverview/utils';
import {cn} from '../../../../../utils/cn';

import './TabCard.scss';

const b = cn('tenant-tab-card');

interface UtilizationTabCardProps {
    text: string;
    active?: boolean;
    helpText?: string;
    fillPercent: number; // 0..100
    legendText: string;
}

function UtilizationCardContainer({
    active,
    children,
}: {
    active?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className={b({active})}>
            <Card
                className={b('card-container', {active})}
                type="container"
                view={active ? 'outlined' : 'raised'}
            >
                {children}
            </Card>
        </div>
    );
}

export function UtilizationTabCard({
    text,
    fillPercent,
    helpText,
    legendText,
    active,
}: UtilizationTabCardProps) {
    const {status, percents, fill} = React.useMemo(
        () => calculateBaseDiagramValues({fillWidth: fillPercent}),
        [fillPercent],
    );

    return (
        <UtilizationCardContainer active={active}>
            <Flex gap={3} alignItems="center">
                <DoughnutMetrics
                    size="small"
                    status={status}
                    fillWidth={fill}
                    className={b('doughnut')}
                >
                    <DoughnutMetrics.Value variant="subheader-1">{percents}</DoughnutMetrics.Value>
                </DoughnutMetrics>
                <div className={b('legend-wrapper')}>
                    <DoughnutMetrics.Legend variant="subheader-2">
                        {legendText}
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
        </UtilizationCardContainer>
    );
}
