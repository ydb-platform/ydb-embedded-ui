import React from 'react';

import {ArrowChevronRight, Ban, CircleCheck, CirclePause, LinkSlash} from '@gravity-ui/icons';
import {Flex, HelpMark, Icon, Label, Text} from '@gravity-ui/uikit';
import type {LabelProps} from '@gravity-ui/uikit';

import type {TBridgePile} from '../../../../types/api/cluster';
import {BridgePileGroupStatus, BridgePileState} from '../../../../types/api/cluster';
import {cn} from '../../../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../utils/constants';
import {formatNumber} from '../../../../utils/dataFormatters/dataFormatters';
import i18n from '../../i18n';

import './BridgeInfoTable.scss';

const b = cn('bridge-info-table');
const progressB = cn('bridge-info-table-progress');
const legendB = cn('bridge-info-table-legend');

type GroupStatusTheme = 'positive' | 'warning' | 'danger' | 'dark-complementary' | 'secondary';

interface PreparedGroupStatus {
    label: string;
    theme: GroupStatusTheme;
    value: number;
}

function getBridgePileStateTheme(state?: BridgePileState): NonNullable<LabelProps['theme']> {
    switch (state) {
        case BridgePileState.SYNCHRONIZED:
            return 'success';
        case BridgePileState.SUSPENDED:
            return 'warning';
        case BridgePileState.NOT_SYNCHRONIZED:
        case BridgePileState.PRIMARY:
        case BridgePileState.PROMOTED:
            return 'normal';
        case BridgePileState.UNSPECIFIED:
        case BridgePileState.DISCONNECTED:
        default:
            return 'unknown';
    }
}

function getBridgePileStateLabel(state?: BridgePileState) {
    switch (state) {
        case BridgePileState.PRIMARY:
            return i18n('value_bridge-state-primary');
        case BridgePileState.PROMOTED:
            return i18n('value_bridge-state-promoted');
        case BridgePileState.SYNCHRONIZED:
            return i18n('value_bridge-state-synchronised');
        case BridgePileState.NOT_SYNCHRONIZED:
            return i18n('value_bridge-state-not-synchronised');
        case BridgePileState.SUSPENDED:
            return i18n('value_bridge-state-suspended');
        case BridgePileState.DISCONNECTED:
            return i18n('value_bridge-state-disconnected');
        case BridgePileState.UNSPECIFIED:
            return i18n('value_bridge-state-unspecified');
        default:
            return state;
    }
}

function getBridgePileStateIcon(state?: BridgePileState) {
    switch (state) {
        case BridgePileState.PROMOTED:
            return <Icon data={ArrowChevronRight} size={12} />;
        case BridgePileState.SYNCHRONIZED:
            return <Icon data={CircleCheck} size={12} />;
        case BridgePileState.NOT_SYNCHRONIZED:
            return <Icon data={Ban} size={12} />;
        case BridgePileState.SUSPENDED:
            return <Icon data={CirclePause} size={12} />;
        case BridgePileState.DISCONNECTED:
            return <Icon data={LinkSlash} size={12} />;
        default:
            return undefined;
    }
}

function getBridgePileStateHelp(state?: BridgePileState) {
    switch (state) {
        case BridgePileState.PROMOTED:
            return i18n('context_bridge-pile-state-promoted');
        case BridgePileState.SYNCHRONIZED:
            return i18n('context_bridge-pile-state-synchronised');
        case BridgePileState.NOT_SYNCHRONIZED:
            return i18n('context_bridge-pile-state-not-synchronised');
        case BridgePileState.SUSPENDED:
            return i18n('context_bridge-pile-state-suspended');
        case BridgePileState.DISCONNECTED:
            return i18n('context_bridge-pile-state-disconnected');
        default:
            return undefined;
    }
}

function getNodesLabel(nodes?: number) {
    if (nodes === undefined) {
        return EMPTY_DATA_PLACEHOLDER;
    }

    if (nodes === 1) {
        return i18n('value_nodes-one');
    }

    return i18n('value_nodes-other', {count: formatNumber(nodes)});
}

function getBridgePileGroupStatusLabel(status?: BridgePileGroupStatus) {
    switch (status) {
        case BridgePileGroupStatus.UNKNOWN:
            return i18n('value_bridge-group-status-unknown');
        case BridgePileGroupStatus.FULL:
            return i18n('value_bridge-group-status-full');
        case BridgePileGroupStatus.PARTIAL:
            return i18n('value_bridge-group-status-partial');
        case BridgePileGroupStatus.DEGRADED:
            return i18n('value_bridge-group-status-degraded');
        case BridgePileGroupStatus.DISINTEGRATED:
            return i18n('value_bridge-group-status-disintegrated');
        default:
            return EMPTY_DATA_PLACEHOLDER;
    }
}

function getBridgePileGroupStatus(status: string): BridgePileGroupStatus | undefined {
    if (Object.values(BridgePileGroupStatus).includes(status as BridgePileGroupStatus)) {
        return status as BridgePileGroupStatus;
    }

    return undefined;
}

function getBridgePileGroupStatusTheme(status?: BridgePileGroupStatus): GroupStatusTheme {
    switch (status) {
        case BridgePileGroupStatus.FULL:
            return 'positive';
        case BridgePileGroupStatus.PARTIAL:
            return 'warning';
        case BridgePileGroupStatus.DEGRADED:
            return 'danger';
        case BridgePileGroupStatus.DISINTEGRATED:
            return 'dark-complementary';
        case BridgePileGroupStatus.UNKNOWN:
        default:
            return 'secondary';
    }
}

function prepareGroupStatuses(groupStatuses?: TBridgePile['GroupStatuses']): PreparedGroupStatus[] {
    return Object.entries(groupStatuses ?? {})
        .map(([status, value]) => {
            const groupStatus = getBridgePileGroupStatus(status);
            const label = groupStatus ? getBridgePileGroupStatusLabel(groupStatus) : status;
            const numericValue = Number(value);

            if (!Number.isFinite(numericValue) || numericValue <= 0) {
                return undefined;
            }

            return {
                label,
                theme: getBridgePileGroupStatusTheme(groupStatus),
                value: numericValue,
            };
        })
        .filter((status): status is PreparedGroupStatus => status !== undefined);
}

interface SegmentedProgressBarProps {
    statuses: PreparedGroupStatus[];
    describedBy?: string;
}

function SegmentedProgressBar({statuses, describedBy}: SegmentedProgressBarProps) {
    const total = statuses.reduce((sum, {value}) => sum + value, 0);

    if (!Number.isFinite(total) || total <= 0) {
        return (
            <div
                className={progressB({empty: true})}
                role="img"
                aria-label={i18n('context_group-statuses-empty')}
            />
        );
    }

    return (
        <div
            className={progressB()}
            role="img"
            aria-label={i18n('context_group-statuses')}
            aria-describedby={describedBy}
        >
            {statuses.map(({label, theme, value}) => (
                <div
                    key={`${label}-${value}`}
                    className={progressB('item', {theme})}
                    aria-hidden="true"
                    style={{
                        width: `${(value / total) * 100}%`,
                    }}
                />
            ))}
        </div>
    );
}

interface GroupStatusesLegendProps {
    statuses: PreparedGroupStatus[];
    id?: string;
}

function GroupStatusesLegend({statuses, id}: GroupStatusesLegendProps) {
    if (!statuses.length) {
        return (
            <Text variant="caption-2" color="secondary">
                {EMPTY_DATA_PLACEHOLDER}
            </Text>
        );
    }

    return (
        <ul id={id} className={legendB()} aria-label={i18n('context_group-statuses')}>
            {statuses.map(({label, theme, value}) => (
                <li key={`${label}-${value}`} className={legendB('item')}>
                    <span aria-hidden="true" className={legendB('dot', {theme})} />
                    <Text variant="caption-2" className={legendB('label')}>
                        {label}
                    </Text>
                    <Text variant="caption-2" color="secondary">
                        {formatNumber(value)}
                    </Text>
                </li>
            ))}
        </ul>
    );
}

interface BridgeInfoTableProps {
    piles: TBridgePile[];
}

interface BridgePileCardProps {
    pile: TBridgePile;
}

const BridgePileCard = React.memo(function BridgePileCard({pile}: BridgePileCardProps) {
    const groupStatusesLegendId = React.useId();

    const stateStatus = React.useMemo(() => {
        const stateLabel = getBridgePileStateLabel(pile.State);
        if (!stateLabel) {
            return null;
        }

        const theme = getBridgePileStateTheme(pile.State);
        const icon = getBridgePileStateIcon(pile.State);
        const stateHelp = getBridgePileStateHelp(pile.State);
        const showStateHelp = Boolean(stateHelp);

        return (
            <Label
                theme={theme}
                size="xs"
                icon={icon}
                className={b('state-label', {'with-help': showStateHelp})}
            >
                <Flex alignItems="center" gap={2} wrap="nowrap">
                    {stateLabel}
                    {showStateHelp ? (
                        <HelpMark
                            iconSize="s"
                            className={b('state-help')}
                            popoverProps={{
                                placement: ['top', 'bottom'],
                                className: b('state-help-popover'),
                            }}
                        >
                            {stateHelp}
                        </HelpMark>
                    ) : null}
                </Flex>
            </Label>
        );
    }, [pile.State]);

    const groupStatuses = React.useMemo(
        () => prepareGroupStatuses(pile.GroupStatuses),
        [pile.GroupStatuses],
    );
    const groupStatusesDescriptionId = groupStatuses.length ? groupStatusesLegendId : undefined;

    return (
        <Flex direction="column" gap={2} className={b('pile')}>
            <Flex justifyContent="space-between" alignItems="flex-start" gap={3}>
                <Flex direction="column" className={b('pile-title')}>
                    <Text variant="subheader-1" ellipsis>
                        {pile.Name?.trim() || EMPTY_DATA_PLACEHOLDER}
                    </Text>
                    <Text variant="caption-2" color="secondary">
                        {getNodesLabel(pile.Nodes)}
                    </Text>
                </Flex>
                {stateStatus}
            </Flex>
            <Flex direction="column" gap={1} className={b('statuses')}>
                <SegmentedProgressBar
                    statuses={groupStatuses}
                    describedBy={groupStatusesDescriptionId}
                />
                <GroupStatusesLegend statuses={groupStatuses} id={groupStatusesDescriptionId} />
            </Flex>
        </Flex>
    );
});

export const BridgeInfoTable = React.memo(function BridgeInfoTable({piles}: BridgeInfoTableProps) {
    const renderedPiles = React.useMemo(
        () => piles.map((pile, index) => <BridgePileCard key={pile.PileId ?? index} pile={pile} />),
        [piles],
    );

    return (
        <Flex gap={2} wrap className={b()}>
            {renderedPiles}
        </Flex>
    );
});
