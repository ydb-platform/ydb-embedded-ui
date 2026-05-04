import {Flex, HelpMark, Progress, Text} from '@gravity-ui/uikit';

import {cn} from '../../../../../utils/cn';
import {formatPercent} from '../../../../../utils/dataFormatters/dataFormatters';
import i18n from '../i18n';

import type {
    TenantStorageSegment,
    TenantStorageSegmentKey,
    TenantStorageSystemDetail,
    TenantStorageSystemDetailKey,
} from './utils';
import {TENANT_STORAGE_SEGMENT_KEYS, TENANT_STORAGE_SYSTEM_DETAIL_KEYS} from './utils';

import './TenantStorageSegments.scss';

const b = cn('ydb-tenant-storage-segments');

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

function getActiveDisplaySegments(segments: TenantStorageSegment[]) {
    return segments
        .filter((segment) => segment.value > 0)
        .sort((left, right) => SEGMENT_ORDER_INDEX[left.key] - SEGMENT_ORDER_INDEX[right.key]);
}

function formatSegmentPercent(value: number, total: number) {
    if (!Number.isFinite(total) || total <= 0 || value <= 0) {
        return '';
    }

    const percent = value / total;
    const precision = percent > 0 && percent < 0.01 ? 1 : 0;

    return formatPercent(percent, precision);
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
    const percent = formatSegmentPercent(segment.value, total);

    return (
        <ul className={b('tooltip')}>
            <li>{formatValue(segment.value)}</li>
            {percent ? (
                <li>{i18n('storage.new.context-segment-share', {value: percent, totalLabel})}</li>
            ) : null}
        </ul>
    );
}

export function SegmentedProgressBar({
    activeSegmentKey,
    formatValue,
    onSegmentClick,
    onSegmentMouseEnter,
    onSegmentMouseLeave,
    registerSegmentAnchor,
    segments,
    total,
}: {
    activeSegmentKey?: TenantStorageSegmentKey;
    formatValue: (value: number) => string;
    onSegmentClick: (segmentKey: TenantStorageSegmentKey, anchor: HTMLElement) => void;
    onSegmentMouseEnter: (segmentKey: TenantStorageSegmentKey, anchor: HTMLElement) => void;
    onSegmentMouseLeave: VoidFunction;
    registerSegmentAnchor: (
        segmentKey: TenantStorageSegmentKey,
        anchor: HTMLDivElement | null,
    ) => void;
    segments: TenantStorageSegment[];
    total?: number;
}) {
    const activeSegments = getActiveDisplaySegments(segments);
    const segmentSum = activeSegments.reduce((sum, s) => sum + s.value, 0);
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
                    <div
                        key={segment.key}
                        aria-label={`${SEGMENT_LABELS[segment.key]}: ${formatValue(segment.value)}`}
                        aria-pressed={activeSegmentKey === segment.key}
                        className={b('item', {inactive})}
                        ref={(anchor) => registerSegmentAnchor(segment.key, anchor)}
                        onBlur={onSegmentMouseLeave}
                        onClick={(event) => onSegmentClick(segment.key, event.currentTarget)}
                        onFocus={(event) => onSegmentMouseEnter(segment.key, event.currentTarget)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                onSegmentClick(segment.key, event.currentTarget);
                            }
                        }}
                        onMouseEnter={(event) =>
                            onSegmentMouseEnter(segment.key, event.currentTarget)
                        }
                        onMouseLeave={onSegmentMouseLeave}
                        role="button"
                        style={{
                            width: `${(segment.value / cappedTotal) * 100}%`,
                            background: SEGMENT_COLORS[segment.key],
                        }}
                        tabIndex={0}
                    />
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
    formatSystemDetailValue,
    onSegmentClick,
    onSegmentMouseEnter,
    onSegmentMouseLeave,
    systemDetails,
}: {
    activeSegmentKey?: TenantStorageSegmentKey;
    segments: TenantStorageSegment[];
    formatValue: (value: number) => string;
    formatSystemDetailValue?: (value: number) => string;
    onSegmentClick: (segmentKey: TenantStorageSegmentKey, anchor: HTMLElement) => void;
    onSegmentMouseEnter: (segmentKey: TenantStorageSegmentKey, anchor: HTMLElement) => void;
    onSegmentMouseLeave: VoidFunction;
    systemDetails?: TenantStorageSystemDetail[];
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
                    <div
                        key={segment.key}
                        aria-pressed={activeSegmentKey === segment.key}
                        className={b('legend-item', {inactive})}
                        onBlur={onSegmentMouseLeave}
                        onClick={(event) => onSegmentClick(segment.key, event.currentTarget)}
                        onFocus={(event) => onSegmentMouseEnter(segment.key, event.currentTarget)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                onSegmentClick(segment.key, event.currentTarget);
                            }
                        }}
                        onMouseEnter={(event) =>
                            onSegmentMouseEnter(segment.key, event.currentTarget)
                        }
                        onMouseLeave={onSegmentMouseLeave}
                        role="button"
                        tabIndex={0}
                    >
                        <div
                            className={b('legend-dot')}
                            style={{background: SEGMENT_COLORS[segment.key]}}
                        />
                        <div className={b('legend-label')}>
                            <Text>{SEGMENT_LABELS[segment.key]}</Text>
                        </div>
                        <Text color="secondary">{formatValue(segment.value)}</Text>
                        {showSystemDetails ? (
                            <HelpMark iconSize="s">
                                <Flex direction="column" gap="1" className={b('system-tooltip')}>
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
                );
            })}
        </div>
    );
}
