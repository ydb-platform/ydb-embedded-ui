import React from 'react';

import {
    ArrowChevronRight,
    Ban,
    Check,
    CirclePause,
    CrownDiamond,
    LinkSlash,
    MapPin,
} from '@gravity-ui/icons';
import {
    ActionTooltip,
    Card,
    DefinitionList,
    Flex,
    Icon,
    Label,
    Progress,
    Text,
    text,
} from '@gravity-ui/uikit';
import type {LabelProps} from '@gravity-ui/uikit';

import {EFlagToStatusName, EntityStatus} from '../../../../components/EntityStatus/EntityStatus';
import {LabelWithHelpMark} from '../../../../components/LabelWithHelpMark/LabelWithHelpMark';
import {Skeleton} from '../../../../components/Skeleton/Skeleton';
import {
    healthcheckApi,
    selectLeavesIssues,
} from '../../../../store/reducers/healthcheckInfo/healthcheckInfo';
import type {TBridgeInfo, TBridgePile} from '../../../../types/api/cluster';
import {BridgePileState} from '../../../../types/api/cluster';
import {EFlag} from '../../../../types/api/enums';
import {cn} from '../../../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../utils/constants';
import {formatNumber} from '../../../../utils/dataFormatters/dataFormatters';
import {useAutoRefreshInterval, useTypedSelector} from '../../../../utils/hooks';
import {useIsUserAllowedToMakeChanges} from '../../../../utils/hooks/useIsUserAllowedToMakeChanges';
import {parseOptionalNonNegativeNumber} from '../../../../utils/utils';
import {useClusterHealthcheckQueryParams} from '../../ClusterDrawerHealthcheck';
import i18n from '../../i18n';

import {BridgeDatabasesSummary} from './BridgeDatabasesSummary';
import {getBridgeNodesProgress} from './bridgeInfo';
import type {BridgePileHealthcheckTarget} from './bridgePileHealthcheck';
import {getBridgePileHealthcheck} from './bridgePileHealthcheck';

import './BridgeInfoTable.scss';

const b = cn('ydb-bridge-info-table');

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
                theme: 'utility',
                icon: <Icon data={CrownDiamond} size={12} />,
                help: i18n('context_bridge-pile-state-primary'),
            };
        case BridgePileState.PROMOTED:
            return {
                label: i18n('value_bridge-state-promoted'),
                theme: 'info',
                icon: <Icon data={ArrowChevronRight} size={12} />,
                help: i18n('context_bridge-pile-state-promoted'),
            };
        case BridgePileState.SYNCHRONIZED:
            return {
                label: i18n('value_bridge-state-synchronised'),
                theme: 'success',
                icon: <Icon data={Check} size={12} />,
                help: i18n('context_bridge-pile-state-synchronised'),
            };
        case BridgePileState.NOT_SYNCHRONIZED:
            return {
                label: i18n('value_bridge-state-not-synchronised'),
                theme: 'warning',
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
                theme: 'danger',
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

interface BridgeInfoTableProps {
    piles: TBridgePile[];
    bridgeInfo?: TBridgeInfo;
    database?: string;
    clusterName?: string;
}

interface BridgePileCardProps {
    pile: TBridgePile;
    current: boolean;
    healthcheckAllowed: boolean;
    healthcheckAvailable: boolean;
    healthcheckSupportsPiles: boolean;
    healthcheckLoading: boolean;
    leavesIssues: ReturnType<typeof selectLeavesIssues>;
    onHealthcheckClick: (target: BridgePileHealthcheckTarget) => void;
}

const BridgePileCard = React.memo(function BridgePileCard({
    pile,
    current,
    healthcheckAllowed,
    healthcheckAvailable,
    healthcheckSupportsPiles,
    healthcheckLoading,
    leavesIssues,
    onHealthcheckClick,
}: BridgePileCardProps) {
    const stateStatus = React.useMemo(() => {
        const {label, theme, icon, help} = getBridgePileStateInfo(pile.State);
        if (!label) {
            return null;
        }

        if (pile.State === BridgePileState.PRIMARY && help) {
            return (
                <ActionTooltip title={help}>
                    <span className={b('state-label')} tabIndex={0}>
                        <Label theme={theme} size="xs" icon={icon}>
                            {label}
                        </Label>
                    </span>
                </ActionTooltip>
            );
        }

        return (
            <LabelWithHelpMark
                theme={theme}
                size="xs"
                icon={icon}
                className={b('state-label')}
                contentGap={2}
                help={help}
                helpMarkProps={{
                    className: b('state-help'),
                    popoverProps: {
                        placement: ['top', 'bottom'],
                        className: b('state-help-popover'),
                    },
                }}
            >
                {label}
            </LabelWithHelpMark>
        );
    }, [pile.State]);

    const pileHealthcheck = React.useMemo(
        () =>
            getBridgePileHealthcheck(
                pile.Name,
                leavesIssues,
                healthcheckAvailable,
                healthcheckSupportsPiles,
            ),
        [healthcheckAvailable, healthcheckSupportsPiles, leavesIssues, pile.Name],
    );

    const pileName = pile.Name?.trim() || EMPTY_DATA_PLACEHOLDER;
    const nodes = pile.Nodes === undefined ? EMPTY_DATA_PLACEHOLDER : formatNumber(pile.Nodes);
    const hasRoleCounters = [
        pile.StorageNodes,
        pile.AliveStorageNodes,
        pile.ComputeNodes,
        pile.AliveComputeNodes,
    ].some((value) => value !== undefined);
    const formatCount = (value?: number) => {
        const count = parseOptionalNonNegativeNumber(value);
        return count === undefined ? EMPTY_DATA_PLACEHOLDER : formatNumber(count);
    };
    const nodeCounters = [
        {kind: 'storage', total: pile.StorageNodes, alive: pile.AliveStorageNodes},
        {kind: 'compute', total: pile.ComputeNodes, alive: pile.AliveComputeNodes},
    ] as const;
    const handleHealthcheckClick = () => {
        if (pileHealthcheck.target) {
            onHealthcheckClick(pileHealthcheck.target);
        }
    };
    const healthcheckAccessibleName = `${i18n('label_bridge-pile-health-status-prefix', {pileName})} ${EFlagToStatusName[pileHealthcheck.status]}`;

    return (
        <Flex
            as={Card}
            view="outlined"
            direction="column"
            gap={3}
            width={321}
            maxWidth="100%"
            className={b('pile')}
        >
            <Flex justifyContent="space-between" alignItems="center" gap={2} width="100%">
                <Flex alignItems="center" gap={1} minWidth={0}>
                    <Text variant="subheader-1" ellipsis className={b('pile-name')}>
                        {pileName}
                    </Text>
                    {current ? (
                        <ActionTooltip title={i18n('label_you-are-here')}>
                            <span
                                role="img"
                                aria-label={i18n('label_you-are-here')}
                                className={b('current-pile')}
                                tabIndex={0}
                            >
                                <Label
                                    theme="info"
                                    size="xs"
                                    icon={<Icon data={MapPin} size={12} />}
                                    qa="bridge-current-pile"
                                />
                            </span>
                        </ActionTooltip>
                    ) : null}
                </Flex>
                {stateStatus}
            </Flex>
            <DefinitionList nameMaxWidth={130} className={text({variant: 'body-1'}, b('details'))}>
                {hasRoleCounters ? (
                    nodeCounters.map(({kind, total, alive}) => {
                        const title = i18n(
                            kind === 'storage' ? 'field_storage-nodes' : 'field_compute-nodes',
                        );
                        const progress = getBridgeNodesProgress(total, alive);
                        return (
                            <DefinitionList.Item key={kind} name={title}>
                                <Flex
                                    alignItems="center"
                                    gap={2}
                                    wrap
                                    qa={'bridge-pile-' + kind + '-nodes'}
                                >
                                    {progress !== undefined ? (
                                        <span className={b('nodes-progress')} aria-hidden="true">
                                            <Progress value={progress} size="xs" theme="info" />
                                        </span>
                                    ) : null}
                                    <Text whiteSpace="nowrap">
                                        {i18n('value_nodes-alive', {
                                            alive: formatCount(alive),
                                            total: formatCount(total),
                                        })}
                                    </Text>
                                </Flex>
                            </DefinitionList.Item>
                        );
                    })
                ) : (
                    <DefinitionList.Item name={i18n('field_nodes')}>{nodes}</DefinitionList.Item>
                )}
                {healthcheckAllowed && (
                    <DefinitionList.Item name={i18n('field_healthcheck')}>
                        {healthcheckLoading ? (
                            <Skeleton className={b('healthcheck-skeleton')} />
                        ) : (
                            <Flex shrink={0}>
                                <EntityStatus.Label
                                    view="compact"
                                    status={pileHealthcheck.status}
                                    checkIcon="check"
                                    tooltipTitle={
                                        pileHealthcheck.status === EFlag.Green
                                            ? i18n('context_bridge-pile-no-issues')
                                            : undefined
                                    }
                                    size="xxs"
                                    iconSize={12}
                                    onClick={
                                        pileHealthcheck.target ? handleHealthcheckClick : undefined
                                    }
                                    aria-label={healthcheckAccessibleName}
                                    tabIndex={pileHealthcheck.target ? undefined : 0}
                                    qa="bridge-pile-healthcheck"
                                />
                            </Flex>
                        )}
                    </DefinitionList.Item>
                )}
            </DefinitionList>
        </Flex>
    );
});

export const BridgeInfoTable = React.memo(function BridgeInfoTable({
    piles,
    bridgeInfo,
    database,
    clusterName,
}: BridgeInfoTableProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const isMonitoringAllowed = useIsUserAllowedToMakeChanges();
    const {handleOpenHealthcheckIssue} = useClusterHealthcheckQueryParams();
    const {
        currentData: healthcheckData,
        isFetching: healthcheckFetching,
        error: healthcheckError,
    } = healthcheckApi.useGetHealthcheckInfoQuery(
        {database: database ?? '', clusterName},
        {
            pollingInterval: autoRefreshInterval,
            skip: !database || !isMonitoringAllowed,
        },
    );
    const leavesIssues = useTypedSelector((state) =>
        selectLeavesIssues(state, database ?? '', clusterName),
    );

    const healthcheckAvailable =
        Boolean(isMonitoringAllowed) &&
        healthcheckData !== undefined &&
        healthcheckError === undefined;
    const healthcheckLoading = healthcheckData === undefined && healthcheckFetching;
    const currentPileName = healthcheckData?.location?.pile?.name;
    const healthcheckSupportsPiles = healthcheckData?.location?.pile !== undefined;

    const sortedPiles = React.useMemo(() => {
        return piles
            .map((pile, index) => ({
                pile,
                index,
                current: Boolean(currentPileName?.trim() && pile.Name === currentPileName),
            }))
            .sort((left, right) => {
                if (left.current !== right.current) {
                    return left.current ? -1 : 1;
                }
                const leftPrimary = left.pile.State === BridgePileState.PRIMARY;
                const rightPrimary = right.pile.State === BridgePileState.PRIMARY;
                if (leftPrimary !== rightPrimary) {
                    return leftPrimary ? -1 : 1;
                }
                return left.index - right.index;
            });
    }, [piles, currentPileName]);

    return (
        <Flex direction="column" gap={3} className={b()}>
            {bridgeInfo ? <BridgeDatabasesSummary bridgeInfo={bridgeInfo} /> : null}
            <Flex wrap className={b('piles')}>
                {sortedPiles.map(({pile, index, current}) => (
                    <BridgePileCard
                        key={pile.PileId ?? pile.Name ?? index}
                        pile={pile}
                        current={current}
                        healthcheckAllowed={Boolean(isMonitoringAllowed)}
                        healthcheckAvailable={healthcheckAvailable}
                        healthcheckSupportsPiles={healthcheckSupportsPiles}
                        healthcheckLoading={healthcheckLoading}
                        leavesIssues={leavesIssues}
                        onHealthcheckClick={handleOpenHealthcheckIssue}
                    />
                ))}
            </Flex>
        </Flex>
    );
});
