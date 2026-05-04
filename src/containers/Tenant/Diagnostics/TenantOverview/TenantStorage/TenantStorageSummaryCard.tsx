import React from 'react';

import {Flex, HelpMark, Popup, Progress, Text} from '@gravity-ui/uikit';
import type {PopupPlacement} from '@gravity-ui/uikit';
import {debounce} from 'lodash';

import {cn} from '../../../../../utils/cn';
import {formatNumber} from '../../../../../utils/dataFormatters/dataFormatters';
import i18n from '../i18n';

import {LegendItems, SegmentTooltipContent, SegmentedProgressBar} from './TenantStorageSegments';
import {formatSummaryPercent} from './displayFormatters';
import type {
    TenantStorageSegment,
    TenantStorageSegmentKey,
    TenantStorageSummary,
    TenantStorageSystemDetail,
} from './utils';

import './TenantStorageSummaryCard.scss';

const b = cn('ydb-tenant-storage-summary-card');

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

function SummaryMetric({label, note, value, emphasize, hideDivider}: SummaryMetricProps) {
    return (
        <div className={b('metric', {emphasize, 'hide-divider': hideDivider})}>
            <Text variant="subheader-2">{value}</Text>
            <Flex alignItems="center" gap="1" className={b('metric-label')}>
                <Text color="secondary">{label}</Text>
                {note ? <HelpMark iconSize="s">{note}</HelpMark> : null}
            </Flex>
        </div>
    );
}

function useSegmentPopupState(activeSegments: TenantStorageSegment[]) {
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

    return {
        activeSegment,
        activeSegmentAnchor,
        activeSegmentKey,
        handlePopupClose,
        handlePopupMouseEnter,
        handlePopupMouseLeave,
        handleSegmentClick,
        handleSegmentMouseEnter,
        handleSegmentMouseLeave,
        popupOpen,
        registerSegmentAnchor,
    };
}

export function SummaryCard({
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
    const {
        activeSegment,
        activeSegmentAnchor,
        activeSegmentKey,
        handlePopupClose,
        handlePopupMouseEnter,
        handlePopupMouseLeave,
        handleSegmentClick,
        handleSegmentMouseEnter,
        handleSegmentMouseLeave,
        popupOpen,
        registerSegmentAnchor,
    } = useSegmentPopupState(activeSegments);

    let percent = 0;

    if (total) {
        percent = summary.usedPercent;
    } else if (displayNoLimit === 'filled') {
        percent = 100;
    }

    return (
        <div className={b({first: position === 'first', last: position === 'last'})}>
            <Flex justifyContent="space-between" alignItems="flex-start" gap="4">
                <div className={b('copy')}>
                    <Text variant="subheader-3">{title}</Text>
                    <Flex alignItems="center" gap="1">
                        <Text color="secondary">{description}</Text>
                        {descriptionHelpText ? (
                            <HelpMark iconSize="s">{descriptionHelpText}</HelpMark>
                        ) : null}
                    </Flex>
                </div>
                <div className={b('metrics')}>
                    {metrics.map((metric) => (
                        <SummaryMetric key={metric.label} {...metric} />
                    ))}
                </div>
            </Flex>
            <div className={b('progress')}>
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
                        className={b('progress-bar')}
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
                <Text color="secondary" className={b('used')}>
                    {!total && displayNoLimit === 'filled'
                        ? i18n('storage.new.quota-unlimited')
                        : formatSummaryPercent(summary.usedPercent)}
                </Text>
            </Flex>
            {popupOpen && activeSegmentAnchor && activeSegment ? (
                <Popup
                    anchorElement={activeSegmentAnchor}
                    open
                    placement={SEGMENT_POPUP_PLACEMENT}
                    onOutsideClick={handlePopupClose}
                >
                    <div
                        className={b('segment-popup')}
                        role="tooltip"
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
