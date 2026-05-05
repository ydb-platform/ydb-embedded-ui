import React from 'react';

import {Flex, HelpMark, Progress, Text, Tooltip} from '@gravity-ui/uikit';
import type {PopupPlacement} from '@gravity-ui/uikit';

import {cn} from '../../../../../utils/cn';
import {formatPercent} from '../../../../../utils/dataFormatters/dataFormatters';
import i18n from '../i18n';

import type {
    TenantStorageSegment,
    TenantStorageSegmentKey,
    TenantStorageSystemDetail,
    TenantStorageSystemDetailKey,
} from './utils';
import {
    TENANT_STORAGE_SEGMENT_KEYS,
    TENANT_STORAGE_SYSTEM_DETAIL_KEYS,
    getTenantStorageSegmentDisplayValue,
} from './utils';

import './TenantStorageSegments.scss';

const b = cn('ydb-tenant-storage-segments');

const SEGMENT_TOOLTIP_OPEN_DELAY = 100;
const SEGMENT_TOOLTIP_CLOSE_DELAY = 100;
const SEGMENT_TOOLTIP_PLACEMENT: PopupPlacement = ['top', 'bottom'];

const SEGMENT_COLORS: Record<TenantStorageSegmentKey, string> = {
    [TENANT_STORAGE_SEGMENT_KEYS.rowTables]: 'var(--ydb-storage-segment-row-tables)',
    [TENANT_STORAGE_SEGMENT_KEYS.columnTables]: 'var(--ydb-storage-segment-column-tables)',
    [TENANT_STORAGE_SEGMENT_KEYS.topics]: 'var(--ydb-storage-segment-topics)',
    [TENANT_STORAGE_SEGMENT_KEYS.system]: 'var(--ydb-storage-segment-system)',
    [TENANT_STORAGE_SEGMENT_KEYS.unknown]: 'var(--ydb-storage-segment-unknown)',
};

const SEGMENT_LABELS: Record<TenantStorageSegmentKey, string> = {
    [TENANT_STORAGE_SEGMENT_KEYS.rowTables]: i18n('storage.new.row-tables'),
    [TENANT_STORAGE_SEGMENT_KEYS.columnTables]: i18n('storage.new.column-tables'),
    [TENANT_STORAGE_SEGMENT_KEYS.topics]: i18n('storage.new.topics'),
    [TENANT_STORAGE_SEGMENT_KEYS.system]: i18n('storage.new.system'),
    [TENANT_STORAGE_SEGMENT_KEYS.unknown]: i18n('storage.new.unknown'),
};

const SEGMENT_ORDER_INDEX: Record<TenantStorageSegmentKey, number> = {
    [TENANT_STORAGE_SEGMENT_KEYS.system]: 0,
    [TENANT_STORAGE_SEGMENT_KEYS.rowTables]: 1,
    [TENANT_STORAGE_SEGMENT_KEYS.columnTables]: 2,
    [TENANT_STORAGE_SEGMENT_KEYS.topics]: 3,
    [TENANT_STORAGE_SEGMENT_KEYS.unknown]: 4,
};

const SYSTEM_DETAIL_LABELS: Record<TenantStorageSystemDetailKey, string> = {
    [TENANT_STORAGE_SYSTEM_DETAIL_KEYS.hive]: i18n('storage.new.system-detail.hive'),
    [TENANT_STORAGE_SYSTEM_DETAIL_KEYS.coordinator]: i18n('storage.new.system-detail.coordinator'),
    [TENANT_STORAGE_SYSTEM_DETAIL_KEYS.mediator]: i18n('storage.new.system-detail.mediator'),
    [TENANT_STORAGE_SYSTEM_DETAIL_KEYS.schemeShard]: i18n('storage.new.system-detail.scheme-shard'),
    [TENANT_STORAGE_SYSTEM_DETAIL_KEYS.sysViewProcessor]: i18n(
        'storage.new.system-detail.sys-view-processor',
    ),
    [TENANT_STORAGE_SYSTEM_DETAIL_KEYS.graphShard]: i18n('storage.new.system-detail.graph-shard'),
    [TENANT_STORAGE_SYSTEM_DETAIL_KEYS.statisticsAggregator]: i18n(
        'storage.new.system-detail.statistics-aggregator',
    ),
    [TENANT_STORAGE_SYSTEM_DETAIL_KEYS.bsController]: i18n(
        'storage.new.system-detail.bs-controller',
    ),
    [TENANT_STORAGE_SYSTEM_DETAIL_KEYS.cms]: i18n('storage.new.system-detail.cms'),
    [TENANT_STORAGE_SYSTEM_DETAIL_KEYS.nodeBroker]: i18n('storage.new.system-detail.node-broker'),
    [TENANT_STORAGE_SYSTEM_DETAIL_KEYS.tenantSlotBroker]: i18n(
        'storage.new.system-detail.tenant-slot-broker',
    ),
    [TENANT_STORAGE_SYSTEM_DETAIL_KEYS.console]: i18n('storage.new.system-detail.console'),
};

function getSegmentProgressValue(segment: TenantStorageSegment) {
    return segment.progressValue ?? segment.value;
}

function getActiveDisplaySegments(segments: TenantStorageSegment[]) {
    return segments
        .filter((segment) => getSegmentProgressValue(segment) > 0)
        .sort((left, right) => SEGMENT_ORDER_INDEX[left.key] - SEGMENT_ORDER_INDEX[right.key]);
}

function formatSegmentPercent(value: number, total: number) {
    if (!Number.isFinite(total) || total <= 0 || value <= 0) {
        return '';
    }

    const percent = value / total;

    return formatPercent(percent, 2);
}

export function SegmentTooltipContent({
    formatValue,
    segment,
    total,
    totalLabel,
}: {
    formatValue: (value: number) => string;
    segment: TenantStorageSegment;
    total: number;
    totalLabel: string;
}) {
    const percent = formatSegmentPercent(getSegmentProgressValue(segment), total);

    return (
        <ul className={b('tooltip')}>
            <li>{formatValue(getTenantStorageSegmentDisplayValue(segment))}</li>
            {percent ? (
                <li>{i18n('storage.new.context-segment-share', {value: percent, totalLabel})}</li>
            ) : null}
        </ul>
    );
}

function SegmentTooltip({
    children,
    formatValue,
    onOpenChange,
    segment,
    total,
    totalLabel,
}: {
    children: React.ReactElement;
    formatValue: (value: number) => string;
    onOpenChange: (segmentKey: TenantStorageSegmentKey, open: boolean) => void;
    segment: TenantStorageSegment;
    total: number;
    totalLabel: string;
}) {
    return (
        <Tooltip
            placement={SEGMENT_TOOLTIP_PLACEMENT}
            openDelay={SEGMENT_TOOLTIP_OPEN_DELAY}
            closeDelay={SEGMENT_TOOLTIP_CLOSE_DELAY}
            content={
                <SegmentTooltipContent
                    formatValue={formatValue}
                    segment={segment}
                    total={total}
                    totalLabel={totalLabel}
                />
            }
            onOpenChange={(open) => onOpenChange(segment.key, open)}
        >
            {children}
        </Tooltip>
    );
}

export function SegmentedProgressBar({
    activeSegmentKey,
    formatValue,
    formatTooltipValue,
    onSegmentOpenChange,
    segments,
    tooltipTotal,
    tooltipTotalLabel,
    total,
}: {
    activeSegmentKey?: TenantStorageSegmentKey;
    formatValue: (value: number) => string;
    formatTooltipValue: (value: number) => string;
    onSegmentOpenChange: (segmentKey: TenantStorageSegmentKey, open: boolean) => void;
    segments: TenantStorageSegment[];
    tooltipTotal: number;
    tooltipTotalLabel: string;
    total?: number;
}) {
    const activeSegments = getActiveDisplaySegments(segments);
    const segmentSum = activeSegments.reduce((sum, s) => sum + getSegmentProgressValue(s), 0);
    const effectiveTotal = total === undefined ? segmentSum : total;

    if (!Number.isFinite(effectiveTotal) || effectiveTotal <= 0 || segmentSum <= 0) {
        return <Progress value={0} size="s" className={b('progress-bar')} />;
    }

    const cappedTotal = Math.max(effectiveTotal, segmentSum);

    return (
        <div className={b('progress')}>
            {activeSegments.map((segment) => {
                const inactive = activeSegmentKey !== undefined && activeSegmentKey !== segment.key;

                return (
                    <SegmentTooltip
                        key={segment.key}
                        formatValue={formatTooltipValue}
                        onOpenChange={onSegmentOpenChange}
                        segment={segment}
                        total={tooltipTotal}
                        totalLabel={tooltipTotalLabel}
                    >
                        <div
                            aria-label={`${SEGMENT_LABELS[segment.key]}: ${formatValue(getTenantStorageSegmentDisplayValue(segment))}`}
                            className={b('item', {inactive})}
                            onMouseDown={(event) => event.preventDefault()}
                            style={{
                                width: `${(getSegmentProgressValue(segment) / cappedTotal) * 100}%`,
                                background: SEGMENT_COLORS[segment.key],
                            }}
                            tabIndex={0}
                        />
                    </SegmentTooltip>
                );
            })}
            <div className={b('empty', {inactive: activeSegmentKey !== undefined})} />
        </div>
    );
}

export function LegendItems({
    activeSegmentKey,
    segments,
    formatValue,
    formatTooltipValue,
    formatSystemDetailValue,
    onSegmentOpenChange,
    systemDetails,
    tooltipTotal,
    tooltipTotalLabel,
}: {
    activeSegmentKey?: TenantStorageSegmentKey;
    segments: TenantStorageSegment[];
    formatValue: (value: number) => string;
    formatTooltipValue: (value: number) => string;
    formatSystemDetailValue?: (value: number) => string;
    onSegmentOpenChange: (segmentKey: TenantStorageSegmentKey, open: boolean) => void;
    systemDetails?: TenantStorageSystemDetail[];
    tooltipTotal: number;
    tooltipTotalLabel: string;
}) {
    const activeSegments = getActiveDisplaySegments(segments);
    const visibleSystemDetails = (systemDetails ?? []).filter((detail) => detail.value > 0);

    if (activeSegments.length === 0) {
        return null;
    }

    return (
        <div className={b('legend-items')}>
            {activeSegments.map((segment) => {
                const isSystemSegment = segment.key === TENANT_STORAGE_SEGMENT_KEYS.system;
                const showSystemDetails = isSystemSegment && visibleSystemDetails.length > 0;
                const inactive = activeSegmentKey !== undefined && activeSegmentKey !== segment.key;

                return (
                    <SegmentTooltip
                        key={segment.key}
                        formatValue={formatTooltipValue}
                        onOpenChange={onSegmentOpenChange}
                        segment={segment}
                        total={tooltipTotal}
                        totalLabel={tooltipTotalLabel}
                    >
                        <div
                            aria-label={`${SEGMENT_LABELS[segment.key]}: ${formatValue(getTenantStorageSegmentDisplayValue(segment))}`}
                            className={b('legend-item', {inactive})}
                            onMouseDown={(event) => event.preventDefault()}
                            tabIndex={0}
                        >
                            <div
                                className={b('legend-dot')}
                                style={{background: SEGMENT_COLORS[segment.key]}}
                            />
                            <div className={b('legend-label')}>
                                <Text>{SEGMENT_LABELS[segment.key]}</Text>
                            </div>
                            <Text color="secondary">
                                {formatValue(getTenantStorageSegmentDisplayValue(segment))}
                            </Text>
                            {showSystemDetails ? (
                                <HelpMark iconSize="s">
                                    <Flex
                                        direction="column"
                                        gap="1"
                                        className={b('system-tooltip')}
                                    >
                                        {visibleSystemDetails.map((detail) => (
                                            <Flex
                                                key={detail.key}
                                                justifyContent="space-between"
                                                gap="4"
                                                className={b('system-tooltip-row')}
                                            >
                                                <Text>{SYSTEM_DETAIL_LABELS[detail.key]}</Text>
                                                <Text color="secondary">
                                                    {formatSystemDetailValue?.(detail.value) ??
                                                        formatValue(detail.value)}
                                                </Text>
                                            </Flex>
                                        ))}
                                    </Flex>
                                </HelpMark>
                            ) : null}
                        </div>
                    </SegmentTooltip>
                );
            })}
        </div>
    );
}
