import React from 'react';

import {Card, Flex} from '@gravity-ui/uikit';

import {DoughnutMetrics} from '../../../../../components/DoughnutMetrics/DoughnutMetrics';
import {getDiagramValues} from '../../../../../containers/Cluster/ClusterOverview/utils';
import type {ETenantType} from '../../../../../types/api/tenant';
import {cn} from '../../../../../utils/cn';

import './TabCard.scss';

const b = cn('tenant-tab-card');

interface UsageTabCardProps {
    text: string;
    active?: boolean;
    helpText?: string;
    subtitle?: string;
    databaseType?: Exclude<ETenantType, 'Serverless'>;
    value: number;
    limit: number;
    legendFormatter: (params: {value: number; capacity: number}) => string;
}

function UsageCardContainer({active, children}: {active?: boolean; children: React.ReactNode}) {
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

export function UsageTabCard({
    text,
    value,
    limit,
    helpText,
    legendFormatter,
    active,
}: UsageTabCardProps) {
    const diagram = React.useMemo(
        () => getDiagramValues({value, capacity: limit, legendFormatter}),
        [value, limit, legendFormatter],
    );

    const {status, percents, legend, fill} = diagram;

    return (
        <UsageCardContainer active={active}>
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
                    <DoughnutMetrics.Legend variant="subheader-2">{legend}</DoughnutMetrics.Legend>
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
        </UsageCardContainer>
    );
}
