import React from 'react';

import type {Column} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';
import {Flex, HelpMark, Popup, Progress, Text} from '@gravity-ui/uikit';
import type {PopupPlacement} from '@gravity-ui/uikit';
import {debounce} from 'lodash';
import {
    ColumnTableIcon,
    ExternalTableIcon,
    TableIcon,
    TableIndexIcon,
    TopicIcon,
    ViewIcon,
} from 'ydb-ui-components';

import {CellWithPopover} from '../../../../../components/CellWithPopover/CellWithPopover';
import {ResponseError} from '../../../../../components/Errors/ResponseError';
import {LinkToSchemaObject} from '../../../../../components/LinkToSchemaObject/LinkToSchemaObject';
import {LoaderWrapper} from '../../../../../components/LoaderWrapper/LoaderWrapper';
import {ResizeableDataTable} from '../../../../../components/ResizeableDataTable/ResizeableDataTable';
import {EPathType} from '../../../../../types/api/schema';
import {EType} from '../../../../../types/api/tenant';
import type {BytesSizes} from '../../../../../utils/bytesParsers';
import {sizes} from '../../../../../utils/bytesParsers';
import {cn} from '../../../../../utils/cn';
import {
    EMPTY_DATA_PLACEHOLDER,
    TENANT_OVERVIEW_TABLES_SETTINGS,
    UNBREAKABLE_GAP,
} from '../../../../../utils/constants';
import {formatNumber, formatPercent} from '../../../../../utils/dataFormatters/dataFormatters';
import {configuredNumeral} from '../../../../../utils/numeral';
import {formatMetricBytes, getConsistentMetricBytesSize} from '../../../../../utils/storageMetrics';
import {mapPathTypeToEntityName, mapPathTypeToNavigationTreeType} from '../../../utils/schema';
import {StatsWrapper} from '../StatsWrapper/StatsWrapper';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';
import i18n from '../i18n';

import type {TenantStorageProps} from './types';
import {useTenantStorageNewData} from './useTenantStorageNewData';
import type {
    TenantStorageData,
    TenantStorageMediaSection,
    TenantStorageSegment,
    TenantStorageSegmentKey,
    TenantStorageSummary,
    TenantStorageSystemDetail,
    TenantStorageSystemDetailKey,
    TenantStorageTopRow,
} from './utils';
import {
    TENANT_STORAGE_SEGMENT_KEYS,
    TENANT_STORAGE_SYSTEM_DETAIL_KEYS,
    buildTenantStorageMediaSections,
    getTenantStorageMediaKey,
    getTenantStoragePhysicalDisplaySegments,
    getTenantStorageUserDataDisplaySummary,
    isSystemStoragePath,
    mergeSystemDetailsByMedia,
} from './utils';

import './TenantStorageNew.scss';

const b = cn('ydb-tenant-storage-new');

const TENANT_STORAGE_COLUMNS_WIDTH_LS_KEY = 'tenantStorageTopUsageTableColumnsWidth';
const SEGMENT_HOVER_DELAY = 100;
const SEGMENT_POPUP_PLACEMENT: PopupPlacement = [
    'top-start',
    'bottom-start',
    'top',
    'bottom',
    'top-end',
    'bottom-end',
];
type SegmentPopupState = {
    anchor: HTMLElement | null;
    key?: TenantStorageSegmentKey;
};

const EMPTY_SEGMENT_POPUP_STATE: SegmentPopupState = {
    anchor: null,
    key: undefined,
};

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

interface SummaryMetricProps {
    label: string;
    note?: string;
    value: string;
    emphasize?: boolean;
    hideDivider?: boolean;
}

interface SummaryCardProps {
    title: string;
    description: string;
    summary: TenantStorageSummary;
    metrics: SummaryMetricProps[];
    descriptionHelpText?: string;
    displayNoLimit?: 'empty' | 'filled';
    segments?: TenantStorageSegment[];
    formatLegendValue?: (value: number) => string;
    formatSystemDetailValue?: (value: number) => string;
    position?: 'first' | 'last';
    systemDetails?: TenantStorageSystemDetail[];
    tooltipTotalLabel: string;
}

function renderPathTypeIcon(row: TenantStorageTopRow) {
    if (isSystemStoragePath(row.path)) {
        return <TableIcon />;
    }

    switch (mapPathTypeToNavigationTreeType(row.pathType, row.pathSubType, 'directory')) {
        case 'column_table':
            return <ColumnTableIcon />;
        case 'topic':
            return <TopicIcon />;
        case 'index':
            return <TableIndexIcon />;
        case 'view':
            return <ViewIcon />;
        case 'external_table':
            return <ExternalTableIcon />;
        case 'table':
        case 'index_table':
        case 'system_table':
            return <TableIcon />;
        default:
            return null;
    }
}

function getObjectName(path: string) {
    const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
    const pathParts = normalizedPath.split('/');

    return pathParts[pathParts.length - 1] || normalizedPath;
}

function formatSummaryPercent(value: number) {
    const formattedValue = formatPercent(value / 100, 0);

    return value > 0 && formattedValue
        ? i18n('storage.new.used-percent', {value: formattedValue})
        : '';
}

function formatSummaryMetricBytes(value?: string | number, size?: BytesSizes) {
    if (size !== 'tb') {
        return formatMetricBytes(value, size);
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return EMPTY_DATA_PLACEHOLDER;
    }

    const convertedValue = numericValue / sizes[size].value;
    const formattedValue = configuredNumeral(convertedValue).format('0,0.00');

    return formattedValue
        ? `${formattedValue}${UNBREAKABLE_GAP}${sizes[size].label}`
        : EMPTY_DATA_PLACEHOLDER;
}

function formatOverheadValue(value?: number) {
    if (value === undefined || !Number.isFinite(value) || value <= 0) {
        return EMPTY_DATA_PLACEHOLDER;
    }

    const precision = value >= 10 || Number.isInteger(value) ? 0 : 1;
    const normalizedValue = Number(value.toFixed(precision));

    return `${formatNumber(normalizedValue)}x`;
}

function getMediaSectionLabel(mediaType?: EType) {
    if (!mediaType || mediaType === EType.None) {
        return undefined;
    }

    return mediaType;
}

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

function SegmentTooltipContent({
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
        <ul className={b('segment-tooltip')}>
            <li>{formatValue(segment.value)}</li>
            {percent ? (
                <li>{i18n('storage.new.context-segment-share', {value: percent, totalLabel})}</li>
            ) : null}
        </ul>
    );
}

function SegmentedProgressBar({
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
        return <Progress value={0} size="s" className={b('summary-progress-bar')} />;
    }

    const cappedTotal = Math.max(effectiveTotal, segmentSum);

    return (
        <div className={b('segment-progress')}>
            {activeSegments.map((segment) => {
                const inactive = activeSegmentKey !== undefined && activeSegmentKey !== segment.key;

                return (
                    <div
                        key={segment.key}
                        aria-label={`${SEGMENT_LABELS[segment.key]}: ${formatValue(segment.value)}`}
                        aria-pressed={activeSegmentKey === segment.key}
                        className={b('segment-item', {inactive})}
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
            <div className={b('segment-empty', {inactive: activeSegmentKey !== undefined})} />
        </div>
    );
}

function LegendItems({
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

function SummaryMetric({label, note, value, emphasize, hideDivider}: SummaryMetricProps) {
    return (
        <div className={b('summary-metric', {emphasize, 'hide-divider': hideDivider})}>
            <Text variant="subheader-2">{value}</Text>
            <Flex alignItems="center" gap="1" className={b('summary-metric-label')}>
                <Text color="secondary">{label}</Text>
                {note ? <HelpMark iconSize="s">{note}</HelpMark> : null}
            </Flex>
        </div>
    );
}

function SummaryCard({
    title,
    description,
    summary,
    metrics,
    descriptionHelpText,
    displayNoLimit,
    segments,
    formatLegendValue,
    formatSystemDetailValue,
    position,
    systemDetails,
    tooltipTotalLabel,
}: SummaryCardProps) {
    const total = summary.quota ?? summary.total;
    const activeSegments = (segments ?? []).filter((s) => s.value > 0);
    const hasSegments = activeSegments.length > 0;
    const segmentAnchorsRef = React.useRef<
        Partial<Record<TenantStorageSegmentKey, HTMLDivElement | null>>
    >({});
    const [hoveredSegmentState, setHoveredSegmentState] =
        React.useState<SegmentPopupState>(EMPTY_SEGMENT_POPUP_STATE);
    const [isPopupContentHovered, setIsPopupContentHovered] = React.useState(false);
    const [pinnedSegmentState, setPinnedSegmentState] =
        React.useState<SegmentPopupState>(EMPTY_SEGMENT_POPUP_STATE);
    const isPinnedRef = React.useRef(false);
    const isPopupContentHoveredRef = React.useRef(false);
    const clearHoveredSegmentState = React.useMemo(() => {
        return debounce(() => {
            if (isPinnedRef.current || isPopupContentHoveredRef.current) {
                return;
            }

            setHoveredSegmentState(EMPTY_SEGMENT_POPUP_STATE);
        }, SEGMENT_HOVER_DELAY);
    }, []);
    const activeSegmentKey = pinnedSegmentState.key ?? hoveredSegmentState.key;
    const activeSegmentAnchor = pinnedSegmentState.anchor ?? hoveredSegmentState.anchor;
    const activeSegment = activeSegments.find((segment) => segment.key === activeSegmentKey);
    const popupOpen = Boolean(activeSegmentAnchor && activeSegment);

    React.useEffect(() => {
        isPinnedRef.current = Boolean(pinnedSegmentState.key);
    }, [pinnedSegmentState.key]);

    React.useEffect(() => {
        isPopupContentHoveredRef.current = isPopupContentHovered;
    }, [isPopupContentHovered]);

    const registerSegmentAnchor = React.useCallback(
        (segmentKey: TenantStorageSegmentKey, anchor: HTMLDivElement | null) => {
            segmentAnchorsRef.current[segmentKey] = anchor;
        },
        [],
    );
    const resolveSegmentAnchor = React.useCallback(
        (segmentKey: TenantStorageSegmentKey, fallbackAnchor: HTMLElement) => {
            return segmentAnchorsRef.current[segmentKey] ?? fallbackAnchor;
        },
        [],
    );
    const handleSegmentMouseEnter = React.useCallback(
        (segmentKey: TenantStorageSegmentKey, anchor: HTMLElement) => {
            if (isPinnedRef.current) {
                return;
            }

            clearHoveredSegmentState.cancel();
            setHoveredSegmentState({
                anchor: resolveSegmentAnchor(segmentKey, anchor),
                key: segmentKey,
            });
        },
        [clearHoveredSegmentState, resolveSegmentAnchor],
    );
    const handleSegmentMouseLeave = React.useCallback(() => {
        if (isPinnedRef.current) {
            return;
        }

        clearHoveredSegmentState();
    }, [clearHoveredSegmentState]);
    const handleSegmentClick = React.useCallback(
        (segmentKey: TenantStorageSegmentKey, anchor: HTMLElement) => {
            clearHoveredSegmentState.cancel();
            setHoveredSegmentState(EMPTY_SEGMENT_POPUP_STATE);
            setIsPopupContentHovered(false);

            setPinnedSegmentState((state) => {
                if (state.key === segmentKey) {
                    return EMPTY_SEGMENT_POPUP_STATE;
                }

                return {anchor: resolveSegmentAnchor(segmentKey, anchor), key: segmentKey};
            });
        },
        [clearHoveredSegmentState, resolveSegmentAnchor],
    );
    const handlePopupMouseEnter = React.useCallback(() => {
        clearHoveredSegmentState.cancel();
        setIsPopupContentHovered(true);
    }, [clearHoveredSegmentState]);
    const handlePopupMouseLeave = React.useCallback(() => {
        setIsPopupContentHovered(false);

        if (!isPinnedRef.current) {
            clearHoveredSegmentState();
        }
    }, [clearHoveredSegmentState]);
    const handlePopupClose = React.useCallback(() => {
        clearHoveredSegmentState.cancel();
        setHoveredSegmentState(EMPTY_SEGMENT_POPUP_STATE);
        setPinnedSegmentState(EMPTY_SEGMENT_POPUP_STATE);
        setIsPopupContentHovered(false);
    }, [clearHoveredSegmentState]);

    React.useEffect(() => {
        return () => {
            clearHoveredSegmentState.cancel();
        };
    }, [clearHoveredSegmentState]);

    let percent = 0;

    if (total) {
        percent = summary.usedPercent;
    } else if (displayNoLimit === 'filled') {
        percent = 100;
    }

    return (
        <div
            className={b('summary-card', {first: position === 'first', last: position === 'last'})}
        >
            <Flex justifyContent="space-between" alignItems="flex-start" gap="4">
                <div className={b('summary-copy')}>
                    <Text variant="subheader-3">{title}</Text>
                    <Flex alignItems="center" gap="1">
                        <Text color="secondary">{description}</Text>
                        {descriptionHelpText ? (
                            <HelpMark iconSize="s">{descriptionHelpText}</HelpMark>
                        ) : null}
                    </Flex>
                </div>
                <div className={b('summary-metrics')}>
                    {metrics.map((metric) => (
                        <SummaryMetric key={metric.label} {...metric} />
                    ))}
                </div>
            </Flex>
            <div className={b('summary-progress')}>
                {hasSegments ? (
                    <SegmentedProgressBar
                        activeSegmentKey={activeSegmentKey}
                        formatValue={formatLegendValue ?? formatNumber}
                        onSegmentClick={handleSegmentClick}
                        onSegmentMouseEnter={handleSegmentMouseEnter}
                        onSegmentMouseLeave={handleSegmentMouseLeave}
                        registerSegmentAnchor={registerSegmentAnchor}
                        segments={segments ?? []}
                        total={total}
                    />
                ) : (
                    <Progress
                        value={percent}
                        size="s"
                        className={b('summary-progress-bar')}
                        text={undefined}
                        theme="success"
                    />
                )}
            </div>
            <Flex justifyContent="space-between" alignItems="center" gap="4">
                {hasSegments && formatLegendValue ? (
                    <LegendItems
                        activeSegmentKey={activeSegmentKey}
                        segments={segments ?? []}
                        formatValue={formatLegendValue}
                        formatSystemDetailValue={formatSystemDetailValue}
                        onSegmentClick={handleSegmentClick}
                        onSegmentMouseEnter={handleSegmentMouseEnter}
                        onSegmentMouseLeave={handleSegmentMouseLeave}
                        systemDetails={systemDetails}
                    />
                ) : (
                    <div />
                )}
                <Text color="secondary" className={b('summary-used')}>
                    {!total && displayNoLimit === 'filled'
                        ? i18n('storage.new.quota-unlimited')
                        : formatSummaryPercent(summary.usedPercent)}
                </Text>
            </Flex>
            {popupOpen && activeSegmentAnchor && activeSegment ? (
                <Popup
                    anchorElement={activeSegmentAnchor}
                    hasArrow
                    open
                    placement={SEGMENT_POPUP_PLACEMENT}
                    onOutsideClick={handlePopupClose}
                >
                    <div
                        className={b('segment-popup')}
                        onMouseEnter={handlePopupMouseEnter}
                        onMouseLeave={handlePopupMouseLeave}
                    >
                        <SegmentTooltipContent
                            formatValue={formatLegendValue ?? formatNumber}
                            segment={activeSegment}
                            total={summary.used}
                            totalLabel={tooltipTotalLabel}
                        />
                    </div>
                </Popup>
            ) : null}
        </div>
    );
}

function TypeCell({row}: {row: TenantStorageTopRow}) {
    const defaultLabel =
        mapPathTypeToEntityName(row.pathType, row.pathSubType) ?? i18n('storage.new.type-unknown');
    let label = defaultLabel;

    if (isSystemStoragePath(row.path)) {
        label = i18n('storage.new.type-system');
    } else if (row.pathType === EPathType.EPathTypeTable) {
        label = i18n('storage.new.type-row-table');
    }

    return (
        <Flex alignItems="center" gap="2" className={b('type-cell')}>
            <div className={b('type-icon')}>{renderPathTypeIcon(row)}</div>
            <Text>{label}</Text>
        </Flex>
    );
}

function ObjectPathCell({row}: {row: TenantStorageTopRow}) {
    const objectName = getObjectName(row.path);

    return (
        <Flex direction="column" gap="1" className={b('object-cell')}>
            <CellWithPopover content={objectName} disabled={!objectName}>
                <LinkToSchemaObject path={row.path} className={b('object-link')}>
                    {objectName}
                </LinkToSchemaObject>
            </CellWithPopover>
            <CellWithPopover content={row.path}>
                <Text color="secondary" ellipsis>
                    {row.path}
                </Text>
            </CellWithPopover>
        </Flex>
    );
}

function DatabaseSpaceCell({row}: {row: TenantStorageTopRow}) {
    const share = Math.min(Math.max(row.dbShare, 0), 1);
    const percent = share * 100;
    const precision = percent > 0 && percent < 1 ? 1 : 0;

    return (
        <Flex alignItems="center" gap="2" className={b('space-cell')}>
            <div className={b('space-progress')}>
                <Progress value={percent} size="s" className={b('space-progress-bar')} />
            </div>
            <Text className={b('space-value')}>
                {formatPercent(share, precision) || EMPTY_DATA_PLACEHOLDER}
            </Text>
        </Flex>
    );
}

function getTopUsageColumns(): Column<TenantStorageTopRow>[] {
    return [
        {
            name: 'type',
            header: i18n('storage.new.table.type'),
            width: 180,
            align: DataTable.LEFT,
            render: ({row}) => <TypeCell row={row} />,
        },
        {
            name: 'path',
            header: i18n('storage.new.table.object-path'),
            width: 320,
            align: DataTable.LEFT,
            render: ({row}) => <ObjectPathCell row={row} />,
        },
        {
            name: 'dbShare',
            header: i18n('storage.new.table.database-space'),
            width: 200,
            align: DataTable.LEFT,
            render: ({row}) => <DatabaseSpaceCell row={row} />,
        },
        {
            name: 'dataSize',
            header: i18n('storage.new.table.user-data'),
            width: 120,
            align: DataTable.LEFT,
            render: ({row}) => formatMetricBytes(row.userData, 'gb'),
        },
        {
            name: 'storageSize',
            header: i18n('storage.new.table.physical-disk'),
            width: 140,
            align: DataTable.LEFT,
            render: ({row}) => formatMetricBytes(row.physicalDisk, 'gb'),
        },
        {
            name: 'overhead',
            header: (
                <Flex alignItems="center" gap="1">
                    <span>{i18n('storage.new.table.overhead')}</span>
                    <HelpMark iconSize="s">{i18n('storage.new.overhead-description')}</HelpMark>
                </Flex>
            ),
            width: 110,
            align: DataTable.LEFT,
            render: ({row}) => formatOverheadValue(row.overhead),
        },
    ];
}

function renderUserSummary(summary: TenantStorageSummary, segments?: TenantStorageSegment[]) {
    const metricsSize = getConsistentMetricBytesSize([
        summary.available,
        summary.used,
        summary.quota,
    ]);

    const formatLegendValue = (value: number) => formatMetricBytes(value, metricsSize);
    const availableValue = formatSummaryMetricBytes(summary.available, metricsSize);
    const formattedAvailableValue =
        summary.availableApproximate && availableValue !== EMPTY_DATA_PLACEHOLDER
            ? `~${availableValue}`
            : availableValue;

    return (
        <SummaryCard
            title={i18n('storage.new.user-data-title')}
            description={i18n('storage.new.user-data-description')}
            summary={summary}
            descriptionHelpText={i18n('storage.new.user-data-description-tooltip')}
            segments={segments}
            formatLegendValue={formatLegendValue}
            position="first"
            tooltipTotalLabel={i18n('storage.new.context-total-user-data')}
            metrics={[
                {
                    hideDivider: true,
                    label: i18n('storage.new.available'),
                    note: summary.availableApproximate
                        ? i18n('storage.new.available-approximate-description')
                        : undefined,
                    value: formattedAvailableValue,
                },
                {
                    label: i18n('storage.new.used'),
                    value: formatSummaryMetricBytes(summary.used, metricsSize),
                },
                {
                    label: i18n('storage.new.quota'),
                    value:
                        summary.quota === undefined
                            ? EMPTY_DATA_PLACEHOLDER
                            : formatSummaryMetricBytes(summary.quota, metricsSize),
                },
            ]}
        />
    );
}

function renderPhysicalSummary(
    summary: TenantStorageSummary,
    segments?: TenantStorageSegment[],
    systemDetails?: TenantStorageSystemDetail[],
) {
    const metricsSize = getConsistentMetricBytesSize([
        summary.available,
        summary.used,
        summary.total,
    ]);

    const formatLegendValue = (value: number) => formatMetricBytes(value, metricsSize);
    const systemDetailsSize = getConsistentMetricBytesSize(
        (systemDetails ?? []).map((detail) => detail.value),
    );
    const formatSystemDetailValue = (value: number) => formatMetricBytes(value, systemDetailsSize);

    return (
        <SummaryCard
            title={i18n('storage.new.physical-title')}
            description={i18n('storage.new.physical-description')}
            summary={summary}
            segments={segments}
            formatLegendValue={formatLegendValue}
            formatSystemDetailValue={formatSystemDetailValue}
            position="last"
            tooltipTotalLabel={i18n('storage.new.context-total-physical-disk-usage')}
            metrics={[
                {
                    emphasize: true,
                    label: i18n('storage.new.overhead'),
                    note: i18n('storage.new.overhead-description'),
                    value: formatOverheadValue(summary.overhead),
                },
                {
                    hideDivider: true,
                    label: i18n('storage.new.available'),
                    value: formatSummaryMetricBytes(summary.available, metricsSize),
                },
                {
                    label: i18n('storage.new.used'),
                    value: formatSummaryMetricBytes(summary.used, metricsSize),
                },
                {
                    label: i18n('storage.new.total'),
                    value: formatSummaryMetricBytes(summary.total, metricsSize),
                },
            ]}
            displayNoLimit="filled"
            systemDetails={systemDetails}
        />
    );
}

function MediaSection({
    section,
    showMediaTypeLabel,
    data,
}: {
    section: TenantStorageMediaSection;
    showMediaTypeLabel: boolean;
    data: TenantStorageData;
}) {
    const mediaLabel = getMediaSectionLabel(section.mediaType);
    const userDataSummary = getTenantStorageUserDataDisplaySummary({
        summary: section.userData,
        logicalUserData: data.logicalUserData,
        useLogicalBreakdown: !showMediaTypeLabel,
        physical: section.physical,
    });
    const userSegments = showMediaTypeLabel ? undefined : data.userDataSegments;
    let physicalSegments: TenantStorageSegment[];
    let systemDetails: TenantStorageSystemDetail[] | undefined;

    if (section.mediaType === EType.None) {
        physicalSegments = data.summary.physical.segments;
        systemDetails = mergeSystemDetailsByMedia(data.systemDetailsByMedia);
    } else {
        const mediaBreakdownKey = getTenantStorageMediaKey(section.mediaType);

        physicalSegments = getTenantStoragePhysicalDisplaySegments({
            segments: data.physicalSegmentsByMedia[mediaBreakdownKey],
            used: section.physical.used,
        });
        systemDetails = data.systemDetailsByMedia[mediaBreakdownKey];
    }

    return (
        <Flex direction="column" gap={3} className={b('media-section')}>
            {showMediaTypeLabel && mediaLabel ? (
                <Text variant="subheader-2" className={b('media-title')}>
                    {mediaLabel}
                </Text>
            ) : null}
            {renderUserSummary(userDataSummary, userSegments)}
            {renderPhysicalSummary(section.physical, physicalSegments, systemDetails)}
        </Flex>
    );
}

export function TenantStorageNew({
    database,
    databaseFullPath,
    metrics,
    blobStorageStats,
    tabletStorageStats,
}: TenantStorageProps) {
    const {currentData, data, error, isFetching} = useTenantStorageNewData({
        database,
        databaseFullPath,
        metrics,
    });
    const loading = isFetching && currentData === undefined;
    const columns = React.useMemo(() => getTopUsageColumns(), []);
    const mediaSections = React.useMemo(() => {
        return buildTenantStorageMediaSections({
            blobStorageStats,
            metrics,
            tabletStorageStats,
        });
    }, [blobStorageStats, metrics, tabletStorageStats]);

    if (error && !currentData) {
        return <ResponseError error={error} />;
    }

    const topRowsError = data.topRowsError ?? error;

    return (
        <LoaderWrapper loading={loading}>
            <Flex direction="column" gap={4} className={b()}>
                <div className={b('sections-group')}>
                    <div className={b('sections-inner')}>
                        {mediaSections.map((section, index) => (
                            <MediaSection
                                key={`${section.mediaType}-${index}`}
                                section={section}
                                showMediaTypeLabel={mediaSections.length > 1}
                                data={data}
                            />
                        ))}
                    </div>
                </div>
                <StatsWrapper
                    title={
                        <React.Fragment>
                            <Text variant="subheader-3">
                                {i18n('storage.new.top-space-title-main')}
                            </Text>{' '}
                            <Text variant="subheader-3" color="hint">
                                {i18n('storage.new.top-space-title-suffix')}
                            </Text>
                        </React.Fragment>
                    }
                >
                    <TenantOverviewTableLayout
                        loading={loading}
                        error={topRowsError}
                        withData={Boolean(currentData)}
                    >
                        <ResizeableDataTable
                            columnsWidthLSKey={TENANT_STORAGE_COLUMNS_WIDTH_LS_KEY}
                            columns={columns}
                            data={data.topRows}
                            settings={TENANT_OVERVIEW_TABLES_SETTINGS}
                        />
                    </TenantOverviewTableLayout>
                </StatsWrapper>
            </Flex>
        </LoaderWrapper>
    );
}
