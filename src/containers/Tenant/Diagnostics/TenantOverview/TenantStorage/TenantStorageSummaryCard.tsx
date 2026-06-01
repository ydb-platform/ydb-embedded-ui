import React from 'react';

import {Flex, HelpMark, Label, Progress, Text} from '@gravity-ui/uikit';

import {cn} from '../../../../../utils/cn';
import {formatNumber} from '../../../../../utils/dataFormatters/dataFormatters';

import {LegendItems, SegmentedProgressBar} from './TenantStorageSegments';
import type {
    TenantStorageSegmentOpenChange,
    TenantStorageSegmentOpenSource,
} from './TenantStorageSegments';
import {formatSummaryPercent} from './displayFormatters';
import i18n from './i18n';
import type {
    TenantStorageSegment,
    TenantStorageSegmentKey,
    TenantStorageSummary,
    TenantStorageSystemDetail,
} from './utils';

import './TenantStorageSummaryCard.scss';

const b = cn('ydb-tenant-storage-summary-card');

export interface SummaryMetricProps {
    label: string;
    note?: string;
    notePlacement?: 'label' | 'value';
    noteTitle?: string;
    value: string;
    emphasize?: boolean;
    hideDivider?: boolean;
}

interface SummaryCardRowBaseProps {
    summary: TenantStorageSummary;
    metrics: SummaryMetricProps[];
    displayNoLimit?: 'empty' | 'filled';
    segments?: TenantStorageSegment[];
    formatLegendValue?: (value: number) => string;
    formatSystemDetailValue?: (value: number) => string;
    formatTooltipValue?: (value: number) => string;
    systemDetails?: TenantStorageSystemDetail[];
    tooltipTotalLabel: string;
}

interface SummaryCardProps {
    title: string;
    description: string;
    descriptionHelpText?: string;
    position?: 'first' | 'last';
}

type SummaryCardPropsWithRow = SummaryCardProps & SummaryCardRowBaseProps;

interface ActiveStorageSegment {
    key: TenantStorageSegmentKey;
    source: TenantStorageSegmentOpenSource;
}

export interface GroupedSummaryCardRow extends SummaryCardRowBaseProps {
    id: string;
    mediaLabel?: string;
}

interface GroupedSummaryCardProps extends SummaryCardProps {
    rows: GroupedSummaryCardRow[];
}

function SummaryMetricNote({note, noteTitle}: Pick<SummaryMetricProps, 'note' | 'noteTitle'>) {
    if (!note && !noteTitle) {
        return null;
    }

    const content = noteTitle ? (
        <div className={b('metric-note')}>
            <Text variant="subheader-2">{noteTitle}</Text>
            {note ? <Text>{note}</Text> : null}
        </div>
    ) : (
        note
    );

    return <HelpMark iconSize="s">{content}</HelpMark>;
}

function SummaryMetric({
    label,
    note,
    notePlacement = 'label',
    noteTitle,
    value,
    emphasize,
    hideDivider,
}: SummaryMetricProps) {
    const noteElement = <SummaryMetricNote note={note} noteTitle={noteTitle} />;

    return (
        <div className={b('metric', {emphasize, 'hide-divider': hideDivider})}>
            <Flex alignItems="center" gap="1">
                <Text variant="subheader-2" className={b('metric-value')}>
                    {value}
                </Text>
                {notePlacement === 'value' ? noteElement : null}
            </Flex>
            <Flex alignItems="center" gap="1" className={b('metric-label')}>
                <Text color="secondary">{label}</Text>
                {notePlacement === 'label' ? noteElement : null}
            </Flex>
        </div>
    );
}

function GroupedSummaryMetric({
    label,
    note,
    notePlacement = 'label',
    noteTitle,
    value,
    emphasize,
    hideDivider,
}: SummaryMetricProps) {
    const noteElement = <SummaryMetricNote note={note} noteTitle={noteTitle} />;

    if (emphasize) {
        return (
            <div className={b('metric', {emphasize, grouped: true, 'hide-divider': hideDivider})}>
                <Label theme="normal" size="xs" value={value}>
                    {label}
                </Label>
                {noteElement}
            </div>
        );
    }

    return (
        <div className={b('metric', {grouped: true, 'hide-divider': hideDivider})}>
            <Flex alignItems="center" gap="1" className={b('metric-label')}>
                <Text color="secondary">{label}</Text>
                {notePlacement === 'label' ? noteElement : null}
            </Flex>
            <Flex alignItems="center" gap="1">
                <Text variant="subheader-1" className={b('metric-value')}>
                    {value}
                </Text>
                {notePlacement === 'value' ? noteElement : null}
            </Flex>
        </div>
    );
}

function SummaryCardCopy({
    description,
    descriptionHelpText,
    title,
}: {
    description: string;
    descriptionHelpText?: string;
    title: string;
}) {
    return (
        <div className={b('copy')}>
            <Text variant="subheader-3">{title}</Text>
            <Flex alignItems="center" gap="1">
                <Text color="secondary">{description}</Text>
                {descriptionHelpText ? (
                    <HelpMark iconSize="s">{descriptionHelpText}</HelpMark>
                ) : null}
            </Flex>
        </div>
    );
}

function SummaryCardRow({
    displayNoLimit,
    formatLegendValue,
    formatSystemDetailValue,
    formatTooltipValue,
    header,
    grouped,
    metrics,
    segments,
    summary,
    systemDetails,
    tooltipTotalLabel,
}: SummaryCardRowBaseProps & {grouped?: boolean; header: React.ReactNode}) {
    const total = summary.quota ?? summary.total;
    const activeSegments = (segments ?? []).filter((s) => s.value > 0);
    const hasSegments = activeSegments.length > 0;
    const [activeSegment, setActiveSegment] = React.useState<ActiveStorageSegment>();
    const activeSegmentKey = activeSegment?.key;
    const handleSegmentOpenChange = React.useCallback<TenantStorageSegmentOpenChange>(
        (segmentKey, open, source) => {
            setActiveSegment((currentSegment) => {
                if (open) {
                    return {key: segmentKey, source};
                }

                return currentSegment?.key === segmentKey && currentSegment.source === source
                    ? undefined
                    : currentSegment;
            });
        },
        [],
    );

    let percent = 0;

    if (total) {
        percent = summary.usedPercent;
    } else if (displayNoLimit === 'filled') {
        percent = 100;
    }

    return (
        <div className={b('row', {grouped})}>
            <Flex
                justifyContent="space-between"
                alignItems="flex-start"
                gap="4"
                className={b('row-header')}
            >
                {header}
                <div className={b('metrics')}>
                    {metrics.map((metric) =>
                        grouped ? (
                            <GroupedSummaryMetric key={metric.label} {...metric} />
                        ) : (
                            <SummaryMetric key={metric.label} {...metric} />
                        ),
                    )}
                </div>
            </Flex>
            <div className={b('progress')}>
                {hasSegments ? (
                    <SegmentedProgressBar
                        activeSegmentKey={activeSegmentKey}
                        formatValue={formatLegendValue ?? formatNumber}
                        formatTooltipValue={formatTooltipValue ?? formatLegendValue ?? formatNumber}
                        onSegmentOpenChange={handleSegmentOpenChange}
                        segments={segments ?? []}
                        tooltipTotal={summary.used}
                        tooltipTotalLabel={tooltipTotalLabel}
                        total={total}
                    />
                ) : (
                    <Progress
                        value={percent}
                        size="s"
                        className={b('progress-bar')}
                        text={undefined}
                        theme="success"
                    />
                )}
            </div>
            <Flex
                className={b('legend')}
                justifyContent="space-between"
                alignItems="center"
                gap="4"
            >
                {hasSegments && formatLegendValue ? (
                    <LegendItems
                        activeSegmentKey={activeSegmentKey}
                        segments={segments ?? []}
                        formatValue={formatLegendValue}
                        formatSystemDetailValue={formatSystemDetailValue}
                        formatTooltipValue={formatTooltipValue ?? formatLegendValue}
                        onSegmentOpenChange={handleSegmentOpenChange}
                        systemDetails={systemDetails}
                        tooltipTotal={summary.used}
                        tooltipTotalLabel={tooltipTotalLabel}
                    />
                ) : (
                    <div />
                )}
                <Text color="secondary" className={b('used')}>
                    {!total && displayNoLimit === 'filled'
                        ? i18n('value_no-limit')
                        : formatSummaryPercent(summary.usedPercent)}
                </Text>
            </Flex>
        </div>
    );
}

export function SummaryCard({
    title,
    description,
    descriptionHelpText,
    position,
    ...rowProps
}: SummaryCardPropsWithRow) {
    return (
        <div className={b({first: position === 'first', last: position === 'last'})}>
            <SummaryCardRow
                {...rowProps}
                header={
                    <SummaryCardCopy
                        title={title}
                        description={description}
                        descriptionHelpText={descriptionHelpText}
                    />
                }
            />
        </div>
    );
}

export function GroupedSummaryCard({
    title,
    description,
    descriptionHelpText,
    position,
    rows,
}: GroupedSummaryCardProps) {
    return (
        <div className={b({first: position === 'first', grouped: true, last: position === 'last'})}>
            <SummaryCardCopy
                title={title}
                description={description}
                descriptionHelpText={descriptionHelpText}
            />
            <div className={b('rows')}>
                {rows.map(({id, mediaLabel, ...rowProps}) => (
                    <SummaryCardRow
                        key={id}
                        {...rowProps}
                        grouped
                        header={
                            <Text variant="subheader-2" className={b('row-label')}>
                                {mediaLabel}
                            </Text>
                        }
                    />
                ))}
            </div>
        </div>
    );
}
