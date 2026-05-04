import React from 'react';

import {Flex, HelpMark, Label, Popup, Progress, Text} from '@gravity-ui/uikit';
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
                            formatValue={formatTooltipValue ?? formatLegendValue ?? formatNumber}
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
