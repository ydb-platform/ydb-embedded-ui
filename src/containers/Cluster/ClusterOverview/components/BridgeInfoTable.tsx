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

const b = cn('ydb-bridge-info-table');
const progressB = cn('ydb-bridge-info-table-progress');
const legendB = cn('ydb-bridge-info-table-legend');

type GroupStatusTheme = 'positive' | 'warning' | 'danger' | 'dark-complementary' | 'secondary';

interface PreparedGroupStatus {
    label: string;
    theme: GroupStatusTheme;
    value: number;
}

interface BridgePileStateInfo {
    label?: string;
    theme: NonNullable<LabelProps['theme']>;
    icon?: React.ReactNode;
    help?: string;
}

function getBridgePileStateInfo(state?: BridgePileState): BridgePileStateInfo {
    switch (state) {
        case BridgePileState.PRIMARY:
            return {
                label: i18n('value_bridge-state-primary'),
                theme: 'normal',
            };
        case BridgePileState.PROMOTED:
            return {
                label: i18n('value_bridge-state-promoted'),
                theme: 'normal',
                icon: <Icon data={ArrowChevronRight} size={12} />,
                help: i18n('context_bridge-pile-state-promoted'),
            };
        case BridgePileState.SYNCHRONIZED:
            return {
                label: i18n('value_bridge-state-synchronised'),
                theme: 'success',
                icon: <Icon data={CircleCheck} size={12} />,
                help: i18n('context_bridge-pile-state-synchronised'),
            };
        case BridgePileState.NOT_SYNCHRONIZED:
            return {
                label: i18n('value_bridge-state-not-synchronised'),
                theme: 'normal',
                icon: <Icon data={Ban} size={12} />,
                help: i18n('context_bridge-pile-state-not-synchronised'),
            };
        case BridgePileState.SUSPENDED:
            return {
                label: i18n('value_bridge-state-suspended'),
                theme: 'warning',
                icon: <Icon data={CirclePause} size={12} />,
                help: i18n('context_bridge-pile-state-suspended'),
            };
        case BridgePileState.DISCONNECTED:
            return {
                label: i18n('value_bridge-state-disconnected'),
                theme: 'unknown',
                icon: <Icon data={LinkSlash} size={12} />,
                help: i18n('context_bridge-pile-state-disconnected'),
            };
        case BridgePileState.UNSPECIFIED:
            return {
                label: i18n('value_bridge-state-unspecified'),
                theme: 'unknown',
            };
        default:
            return {
                label: state,
                theme: 'unknown',
            };
    }
}

interface BridgePileGroupStatusInfo {
    label: string;
    theme: GroupStatusTheme;
}

function getNodesLabel(nodes?: number) {
    if (nodes === undefined) {
        return EMPTY_DATA_PLACEHOLDER;
    }

    return i18n('value_nodes', {
        count: nodes,
        formattedCount: formatNumber(nodes),
    });
}

function getBridgePileGroupStatusInfo(status?: BridgePileGroupStatus): BridgePileGroupStatusInfo {
    switch (status) {
        case BridgePileGroupStatus.UNKNOWN:
            return {
                label: i18n('value_bridge-group-status-unknown'),
                theme: 'secondary',
            };
        case BridgePileGroupStatus.FULL:
            return {
                label: i18n('value_bridge-group-status-full'),
                theme: 'positive',
            };
        case BridgePileGroupStatus.PARTIAL:
            return {
                label: i18n('value_bridge-group-status-partial'),
                theme: 'warning',
            };
        case BridgePileGroupStatus.DEGRADED:
            return {
                label: i18n('value_bridge-group-status-degraded'),
                theme: 'danger',
            };
        case BridgePileGroupStatus.DISINTEGRATED:
            return {
                label: i18n('value_bridge-group-status-disintegrated'),
                theme: 'dark-complementary',
            };
        default:
            return {
                label: EMPTY_DATA_PLACEHOLDER,
                theme: 'secondary',
            };
    }
}

function getBridgePileGroupStatus(status: string): BridgePileGroupStatus | undefined {
    if (Object.values(BridgePileGroupStatus).includes(status as BridgePileGroupStatus)) {
        return status as BridgePileGroupStatus;
    }

    return undefined;
}

function prepareGroupStatuses(groupStatuses?: TBridgePile['GroupStatuses']): PreparedGroupStatus[] {
    return Object.entries(groupStatuses ?? {})
        .map(([status, value]) => {
            const groupStatus = getBridgePileGroupStatus(status);
            const {label, theme} = groupStatus
                ? getBridgePileGroupStatusInfo(groupStatus)
                : {label: status, theme: 'secondary' as const};
            const numericValue = Number(value);

            if (!Number.isFinite(numericValue) || numericValue <= 0) {
                return undefined;
            }

            return {
                label,
                theme,
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
        const {label, theme, icon, help} = getBridgePileStateInfo(pile.State);
        if (!label) {
            return null;
        }

        const showStateHelp = Boolean(help);

        return (
            <Label
                theme={theme}
                size="xs"
                icon={icon}
                className={b('state-label', {'with-help': showStateHelp})}
            >
                <Flex alignItems="center" gap={2} wrap="nowrap">
                    {label}
                    {showStateHelp ? (
                        <HelpMark
                            iconSize="s"
                            className={b('state-help')}
                            popoverProps={{
                                placement: ['top', 'bottom'],
                                className: b('state-help-popover'),
                            }}
                        >
                            {help}
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
