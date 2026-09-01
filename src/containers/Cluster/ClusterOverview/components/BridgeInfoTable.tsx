import React from 'react';

import {
    Archive,
    ArrowChevronRight,
    Ban,
    ChevronRight,
    CirclePause,
    LinkSlash,
    MapPin,
} from '@gravity-ui/icons';
import {Flex, Icon, Text} from '@gravity-ui/uikit';
import type {LabelProps} from '@gravity-ui/uikit';

import {EntityStatus} from '../../../../components/EntityStatus/EntityStatus';
import {LabelWithHelpMark} from '../../../../components/LabelWithHelpMark/LabelWithHelpMark';
import {Skeleton} from '../../../../components/Skeleton/Skeleton';
import {
    healthcheckApi,
    selectLeavesIssues,
} from '../../../../store/reducers/healthcheckInfo/healthcheckInfo';
import type {TBridgePile} from '../../../../types/api/cluster';
import {BridgePileState} from '../../../../types/api/cluster';
import {cn} from '../../../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../utils/constants';
import {formatNumber} from '../../../../utils/dataFormatters/dataFormatters';
import {useAutoRefreshInterval, useTypedSelector} from '../../../../utils/hooks';
import {useClusterHealthcheckQueryParams} from '../../ClusterDrawerHealthcheck';
import i18n from '../../i18n';

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
                theme: 'normal',
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
                theme: 'normal',
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
    database?: string;
    clusterName?: string;
}

interface BridgePileCardProps {
    pile: TBridgePile;
    current: boolean;
    healthcheckAvailable: boolean;
    healthcheckSupportsPiles: boolean;
    healthcheckLoading: boolean;
    leavesIssues: ReturnType<typeof selectLeavesIssues>;
    onHealthcheckClick: (target: BridgePileHealthcheckTarget) => void;
}

const BridgePileCard = React.memo(function BridgePileCard({
    pile,
    current,
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

        const showStateHelp = Boolean(help);

        return (
            <LabelWithHelpMark
                theme={theme}
                size="xs"
                icon={icon}
                className={b('state-label', {'with-help': showStateHelp})}
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
    const handleHealthcheckClick = () => {
        if (pileHealthcheck.target) {
            onHealthcheckClick(pileHealthcheck.target);
        }
    };

    return (
        <Flex direction="column" gap={2} className={b('pile', {current})}>
            <Flex justifyContent="space-between" alignItems="flex-start" gap={2} width="100%">
                <Text variant="subheader-1" ellipsis className={b('pile-name')}>
                    {pileName}
                </Text>
                {current ? (
                    <Flex gap={1} alignItems="center" className={b('current-pile')}>
                        <Icon data={MapPin} size={12} />
                        <Text variant="body-1">{i18n('label_you-are-here')}</Text>
                    </Flex>
                ) : null}
            </Flex>
            <Flex gap={2} alignItems="center" wrap>
                {stateStatus}
                {healthcheckLoading ? (
                    <Skeleton className={b('healthcheck-skeleton')} />
                ) : (
                    <EntityStatus.Label
                        status={pileHealthcheck.status}
                        size="xs"
                        className={b('healthcheck-status')}
                        onClick={pileHealthcheck.target ? handleHealthcheckClick : undefined}
                        endContent={
                            pileHealthcheck.target ? (
                                <Icon data={ChevronRight} size={12} />
                            ) : undefined
                        }
                        qa="bridge-pile-healthcheck"
                    >
                        {pileHealthcheck.target ? (
                            <span className={b('healthcheck-accessible-prefix')}>
                                {i18n('label_bridge-pile-health-status-prefix', {pileName})}
                            </span>
                        ) : null}
                    </EntityStatus.Label>
                )}
            </Flex>
            <Flex gap={1} alignItems="center" className={b('nodes')}>
                <Icon data={Archive} size={14} />
                <Text variant="body-1">
                    {i18n('field_nodes')}: {nodes}
                </Text>
            </Flex>
        </Flex>
    );
});

export const BridgeInfoTable = React.memo(function BridgeInfoTable({
    piles,
    database,
    clusterName,
}: BridgeInfoTableProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const {handleOpenHealthcheckIssue} = useClusterHealthcheckQueryParams();
    const {
        currentData: healthcheckData,
        isFetching: healthcheckFetching,
        error: healthcheckError,
    } = healthcheckApi.useGetHealthcheckInfoQuery(
        {database: database ?? '', clusterName},
        {
            pollingInterval: autoRefreshInterval,
            skip: !database,
        },
    );
    const leavesIssues = useTypedSelector((state) =>
        selectLeavesIssues(state, database ?? '', clusterName),
    );

    const healthcheckAvailable = healthcheckData !== undefined && healthcheckError === undefined;
    const healthcheckLoading = healthcheckData === undefined && healthcheckFetching;
    const currentPileName = healthcheckData?.location?.pile?.name;
    const healthcheckSupportsPiles = Boolean(currentPileName?.trim());

    const sortedPiles = React.useMemo(() => {
        return piles
            .map((pile, index) => ({pile, index}))
            .sort((left, right) => {
                const leftPrimary = left.pile.State === BridgePileState.PRIMARY;
                const rightPrimary = right.pile.State === BridgePileState.PRIMARY;
                if (leftPrimary !== rightPrimary) {
                    return leftPrimary ? -1 : 1;
                }
                return left.index - right.index;
            });
    }, [piles]);

    return (
        <Flex wrap className={b()}>
            {sortedPiles.map(({pile, index}) => (
                <BridgePileCard
                    key={pile.PileId ?? pile.Name ?? index}
                    pile={pile}
                    current={Boolean(currentPileName?.trim() && pile.Name === currentPileName)}
                    healthcheckAvailable={healthcheckAvailable}
                    healthcheckSupportsPiles={healthcheckSupportsPiles}
                    healthcheckLoading={healthcheckLoading}
                    leavesIssues={leavesIssues}
                    onHealthcheckClick={handleOpenHealthcheckIssue}
                />
            ))}
        </Flex>
    );
});
