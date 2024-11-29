import React from 'react';

import type {TableColumnSetupItem} from '@gravity-ui/uikit';
import {Select, TableColumnSetup, Text} from '@gravity-ui/uikit';

import {EntitiesCount} from '../../../components/EntitiesCount';
import {ProblemFilter} from '../../../components/ProblemFilter';
import {Search} from '../../../components/Search';
import {UptimeFilter} from '../../../components/UptimeFIlter';
import {
    useViewerNodesHandlerHasGroupingBySystemState,
    useViewerNodesHandlerHasNetworkStats,
} from '../../../store/reducers/capabilities/hooks';
import {useProblemFilter} from '../../../store/reducers/settings/hooks';
import type {NodesGroupByField} from '../../../types/api/nodes';
import {PeerRoleFilter} from '../PeerRoleFilter/PeerRoleFilter';
import {getNodesGroupByOptions} from '../columns/constants';
import i18n from '../i18n';
import {b} from '../shared';
import {useNodesPageQueryParams} from '../useNodesPageQueryParams';

interface NodesControlsProps {
    withGroupBySelect?: boolean;
    groupByParams: NodesGroupByField[] | undefined;

    withPeerRoleFilter?: boolean;

    columnsToSelect: TableColumnSetupItem[];
    handleSelectedColumnsUpdate: (updated: TableColumnSetupItem[]) => void;

    entitiesCountCurrent: number;
    entitiesCountTotal?: number;
    entitiesLoading: boolean;
}

export function NodesControls({
    withGroupBySelect,
    groupByParams = [],

    withPeerRoleFilter,

    columnsToSelect,
    handleSelectedColumnsUpdate,

    entitiesCountCurrent,
    entitiesCountTotal,
    entitiesLoading,
}: NodesControlsProps) {
    const {
        searchValue,
        uptimeFilter,
        peerRoleFilter,
        groupByParam,

        handleSearchQueryChange,
        handleUptimeFilterChange,
        handlePeerRoleFilterChange,
        handleGroupByParamChange,
    } = useNodesPageQueryParams(groupByParams);
    const {problemFilter, handleProblemFilterChange} = useProblemFilter();

    const systemStateGroupingAvailable = useViewerNodesHandlerHasGroupingBySystemState();
    const groupByoptions = getNodesGroupByOptions(groupByParams, systemStateGroupingAvailable);

    const networStatsAvailable = useViewerNodesHandlerHasNetworkStats();
    const shouldDisplayPeerRoleFilter = withPeerRoleFilter && networStatsAvailable;

    const handleGroupBySelectUpdate = (value: string[]) => {
        handleGroupByParamChange(value[0]);
    };

    return (
        <React.Fragment>
            <Search
                onChange={handleSearchQueryChange}
                placeholder={i18n('controls_search-placeholder')}
                width={238}
                value={searchValue}
            />
            {systemStateGroupingAvailable && withGroupBySelect ? null : (
                <ProblemFilter value={problemFilter} onChange={handleProblemFilterChange} />
            )}
            {withGroupBySelect ? null : (
                <UptimeFilter value={uptimeFilter} onChange={handleUptimeFilterChange} />
            )}
            {shouldDisplayPeerRoleFilter ? (
                <React.Fragment>
                    <Text variant="body-2">{i18n('controls_peer-role-label')}</Text>
                    <PeerRoleFilter value={peerRoleFilter} onChange={handlePeerRoleFilterChange} />
                </React.Fragment>
            ) : null}
            <TableColumnSetup
                popupWidth={200}
                items={columnsToSelect}
                showStatus
                onUpdate={handleSelectedColumnsUpdate}
                sortable={false}
            />
            {withGroupBySelect ? (
                <React.Fragment>
                    <Text variant="body-2">{i18n('controls_group-by-placeholder')}</Text>
                    <Select
                        hasClear
                        placeholder={'-'}
                        width={150}
                        defaultValue={groupByParam ? [groupByParam] : undefined}
                        onUpdate={handleGroupBySelectUpdate}
                        options={groupByoptions}
                        className={b('group-by-select')}
                        popupClassName={b('group-by-popup')}
                    />
                </React.Fragment>
            ) : null}
            <EntitiesCount
                current={entitiesCountCurrent}
                total={entitiesCountTotal}
                label={i18n('nodes')}
                loading={entitiesLoading}
            />
        </React.Fragment>
    );
}
