import React, {useMemo} from 'react';

import {Card, Flex} from '@gravity-ui/uikit';

import {DoughnutMetrics} from '../../../../../components/DoughnutMetrics/DoughnutMetrics';
import {getDiagramValues} from '../../../../../containers/Cluster/ClusterOverview/utils';
import {cn} from '../../../../../utils/cn';

import './TabCard.scss';

const b = cn('tenant-tab-card');

type TabCardVariant = 'default' | 'serverless';

interface TabCardBaseProps {
    text: string;
    active?: boolean;
    helpText?: string;
    subtitle?: string;
}

interface TabCardDefaultProps extends TabCardBaseProps {
    variant?: Extract<TabCardVariant, 'default'>;
    value: number;
    limit: number;
    legendFormatter: (params: {value: number; capacity: number}) => string;
}

interface TabCardServerlessProps extends TabCardBaseProps {
    variant: Extract<TabCardVariant, 'serverless'>;
}

type TabCardProps = TabCardDefaultProps | TabCardServerlessProps;

function isServerlessProps(props: TabCardProps): props is TabCardServerlessProps {
    return props.variant === 'serverless';
}

function TabCardContainer({active, children}: {active?: boolean; children: React.ReactNode}) {
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

const TabCardDefaultContent = React.memo(function TabCardDefaultContent({
    text,
    value,
    limit,
    helpText,
    legendFormatter,
}: {
    text: string;
    value: number;
    limit: number;
    helpText?: string;
    legendFormatter: (params: {value: number; capacity: number}) => string;
}) {
    const diagram = useMemo(
        () => getDiagramValues({value, capacity: limit, legendFormatter}),
        [value, limit, legendFormatter],
    );

    const {status, percents, legend, fill} = diagram;

    return (
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
    );
});

const TabCardServerlessContent = React.memo(function TabCardServerlessContent({
    text,
    helpText,
    subtitle,
}: {
    text: string;
    helpText?: string;
    subtitle?: string;
}) {
    return (
        <div className={b('legend-wrapper')}>
            <DoughnutMetrics.Legend variant="subheader-2" note={helpText} noteIconSize="s">
                {text}
            </DoughnutMetrics.Legend>
            {subtitle ? (
                <DoughnutMetrics.Legend variant="body-1" color="secondary">
                    {subtitle}
                </DoughnutMetrics.Legend>
            ) : null}
        </div>
    );
});

export function TabCard(props: TabCardProps) {
    const {active} = props;

    return (
        <TabCardContainer active={active}>
            {isServerlessProps(props) ? (
                <TabCardServerlessContent
                    text={props.text}
                    helpText={props.helpText}
                    subtitle={props.subtitle}
                />
            ) : (
                <TabCardDefaultContent
                    text={props.text}
                    value={props.value}
                    limit={props.limit}
                    helpText={props.helpText}
                    legendFormatter={props.legendFormatter}
                />
            )}
        </TabCardContainer>
    );
}
