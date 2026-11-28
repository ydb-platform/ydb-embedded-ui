import React from 'react';

import {Button, Checkbox, Flex, Select, Text} from '@gravity-ui/uikit';
import {BooleanParam, StringParam, useQueryParams} from 'use-query-params';
import {z} from 'zod';

import {DrawerWrapper} from '../../../components/Drawer';
import {ResponseError} from '../../../components/Errors/ResponseError/ResponseError';
import {LoaderWrapper} from '../../../components/LoaderWrapper/LoaderWrapper';
import {PAGINATED_TABLE_IDS, PaginatedTable} from '../../../components/PaginatedTable';
import {PaginatedTableWithLayout} from '../../../components/PaginatedTable/PaginatedTableWithLayout';
import {Search} from '../../../components/Search/Search';
import {backend, clusterName, environment} from '../../../store';
import {storageApi} from '../../../store/reducers/storage/storage';
import type {NbsGroupBy, NbsListParams} from '../../../types/api/nbs';
import {useAutoRefreshInterval} from '../../../utils/hooks';
import {renderPaginatedTableErrorMessage} from '../../../utils/renderPaginatedTableErrorMessage';
import type {PaginatedStorageProps} from '../PaginatedStorage';
import {StorageTypeFilter} from '../StorageTypeFilter/StorageTypeFilter';
import {TableGroup} from '../TableGroup/TableGroup';
import {useExpandedGroups} from '../TableGroup/useExpandedTableGroups';
import {b} from '../shared';
import {useStorageQueryParams} from '../useStorageQueryParams';

import {NbsTabletGroups} from './NbsTabletGroups';
import {getNbsStorage} from './getData';
import type {NbsFilters, NbsRow} from './getData';
import i18n from './i18n';
import {useNbsColumns} from './useNbsColumns';

const locationIdSchema = z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(0).max(0xffffffff));

export function NbsStorage({disks, scrollContainerRef}: PaginatedStorageProps & {disks: boolean}) {
    const {storageType, handleStorageTypeChange} = useStorageQueryParams();
    const [interval] = useAutoRefreshInterval();
    const [query, setQuery] = useQueryParams({
        nbsTabletGroups: StringParam,
        nbsGroupsMode: StringParam,
        nbsSearch: StringParam,
        ddisksSearch: StringParam,
        nbsGroupBy: StringParam,
        ddisksGroupBy: StringParam,
        ddisksNodeId: StringParam,
        ddisksPDiskId: StringParam,
        nbsSort: StringParam,
        ddisksSort: StringParam,
        nbsDesc: BooleanParam,
        ddisksDesc: BooleanParam,
        nbsProblems: BooleanParam,
        ddisksProblems: BooleanParam,
    });
    const search = (disks ? query.ddisksSearch : query.nbsSearch) ?? '';
    const sortOptions = disks
        ? ['disk', 'ddisk_occupancy', 'persistent_buffer_occupancy', 'tablets_count']
        : ['tablet', 'disk_usage', 'degrade', 'groups_count'];
    const requestedSort = (disks ? query.ddisksSort : query.nbsSort) ?? sortOptions[0];
    const sort = sortOptions.includes(requestedSort) ? requestedSort : sortOptions[0];
    const descending = (disks ? query.ddisksDesc : query.nbsDesc) ?? false;
    const problems = (disks ? query.ddisksProblems : query.nbsProblems) ?? false;
    const requestedGroup = disks ? query.ddisksGroupBy : query.nbsGroupBy;
    const groupByOptions: {value: NbsGroupBy; content: string}[] = disks
        ? [{value: 'state', content: i18n('pdisk-state')}]
        : [
              {value: 'degrade', content: i18n('degrade')},
              {value: 'disk_usage', content: i18n('usage')},
          ];
    const groupBy = groupByOptions.find(({value}) => value === requestedGroup)?.value;
    const nodeId = disks ? locationIdSchema.safeParse(query.ddisksNodeId).data : undefined;
    const pdiskId = disks ? locationIdSchema.safeParse(query.ddisksPDiskId).data : undefined;
    const listParams = React.useMemo<NbsListParams>(
        () => ({
            filter: search,
            only_problems: problems,
            group_by: groupBy,
            inventory: disks || undefined,
            node_id: nodeId,
            pdisk_id: pdiskId,
        }),
        [search, problems, groupBy, disks, nodeId, pdiskId],
    );
    const scope = JSON.stringify([backend, clusterName, environment]);
    const filters = React.useMemo<NbsFilters>(
        () => ({
            ...listParams,
            disks,
            sort_by: sort,
            sort_desc: descending,
            scope,
        }),
        [listParams, disks, sort, descending, scope],
    );
    const {currentData, error, isFetching} = storageApi.useGetNbsStorageGroupsQuery(
        {view: disks ? 'disks' : 'tablets', params: listParams, backend, clusterName, environment},
        {
            skip: !groupBy,
            pollingInterval: interval,
        },
    );
    const groups = React.useMemo(
        () =>
            currentData
                ? (currentData.Groups ?? []).map(({Name, Count}) => ({name: Name, count: Count}))
                : undefined,
        [currentData],
    );
    const {expandedGroups, setIsGroupExpanded} = useExpandedGroups(groups);
    const selectedTablet = z.string().regex(/^\d+$/).catch('').parse(query.nbsTabletGroups);
    const groupsMode = z.enum(['all', 'degraded']).catch('all').parse(query.nbsGroupsMode);
    const onShowGroups = React.useCallback(
        (tabletId: string) => {
            setQuery({nbsTabletGroups: tabletId}, 'replaceIn');
        },
        [setQuery],
    );
    const onCloseGroups = React.useCallback(() => {
        setQuery({nbsTabletGroups: undefined}, 'replaceIn');
    }, [setQuery]);
    const columns = useNbsColumns(disks, onShowGroups);
    const sortLabels: Record<string, string> = {
        disk: i18n('disk'),
        tablet: i18n('tablet'),
        disk_usage: i18n('usage'),
        degrade: i18n('degrade'),
        groups_count: i18n('groups'),
        ddisk_occupancy: i18n('ddisk-usage'),
        persistent_buffer_occupancy: i18n('buffer-usage'),
        tablets_count: i18n('nbs-tablets'),
    };
    const table = (group?: string, count?: number) => (
        <PaginatedTable<NbsRow, NbsFilters>
            tableName={disks ? PAGINATED_TABLE_IDS.NBS_DDISKS : PAGINATED_TABLE_IDS.NBS_TABLETS}
            columns={columns}
            fetchData={getNbsStorage}
            filters={{...filters, filter_group: group}}
            initialEntitiesCount={count}
            rowHeight={52}
            scrollContainerRef={scrollContainerRef}
            renderErrorMessage={renderPaginatedTableErrorMessage}
            renderEmptyDataMessage={() => i18n('empty')}
            getKeyboardRowKey={(row) =>
                'TabletId' in row
                    ? row.TabletId
                    : `${row.DiskId.NodeId}:${row.DiskId.PDiskId}:${row.DiskId.DDiskSlotId}`
            }
        />
    );
    const groupTitle = (name: string) => {
        if (groupBy === 'degrade') {
            return `${i18n('degrade')}: ${name}`;
        }
        if (groupBy === 'disk_usage') {
            if (name === 'unknown') {
                return i18n('unknown');
            }
            return Number(name) === 100 ? '≥100%' : `${name}–${Number(name) + 10}%`;
        }
        return name;
    };
    return (
        <DrawerWrapper
            isDrawerVisible={!disks && Boolean(selectedTablet)}
            onCloseDrawer={onCloseGroups}
            drawerControls={[{type: 'close'}]}
            title={i18n('tablet-groups', {tabletId: selectedTablet})}
            drawerId="nbs-tablet-groups"
            defaultWidth={900}
            renderDrawerContent={() =>
                !disks && selectedTablet ? (
                    <NbsTabletGroups
                        key={selectedTablet}
                        tabletId={selectedTablet}
                        mode={groupsMode}
                        onModeChange={(value) => setQuery({nbsGroupsMode: value}, 'replaceIn')}
                    />
                ) : null
            }
        >
            <PaginatedTableWithLayout
                controls={
                    <Flex direction="column" gap={2} width="100%">
                        <Flex gap={2} alignItems="center" wrap className={b('controls-row')}>
                            <Search
                                tableFilter
                                value={search}
                                className={b('search')}
                                placeholder={i18n(disks ? 'search-disks' : 'search-tablets')}
                                onChange={(value) =>
                                    setQuery(
                                        disks ? {ddisksSearch: value} : {nbsSearch: value},
                                        'replaceIn',
                                    )
                                }
                            />
                            <StorageTypeFilter
                                value={storageType}
                                onChange={handleStorageTypeChange}
                            />
                            <Text>{i18n('group-by')}</Text>
                            <Select
                                aria-label={i18n('group-by')}
                                value={[groupBy ?? '']}
                                options={[{value: '', content: i18n('none')}, ...groupByOptions]}
                                onUpdate={([value]) =>
                                    setQuery(
                                        disks
                                            ? {ddisksGroupBy: value || undefined}
                                            : {nbsGroupBy: value || undefined},
                                        'replaceIn',
                                    )
                                }
                            />
                            <Text>{i18n('sort')}</Text>
                            <Select
                                aria-label={i18n('sort')}
                                value={[sort]}
                                options={sortOptions.map((value) => ({
                                    value,
                                    content: sortLabels[value],
                                }))}
                                onUpdate={([value]) =>
                                    setQuery(
                                        disks ? {ddisksSort: value} : {nbsSort: value},
                                        'replaceIn',
                                    )
                                }
                            />
                            <Checkbox
                                checked={descending}
                                onUpdate={(value) =>
                                    setQuery(
                                        disks ? {ddisksDesc: value} : {nbsDesc: value},
                                        'replaceIn',
                                    )
                                }
                            >
                                {i18n('descending')}
                            </Checkbox>
                            <Checkbox
                                checked={problems}
                                onUpdate={(value) =>
                                    setQuery(
                                        disks ? {ddisksProblems: value} : {nbsProblems: value},
                                        'replaceIn',
                                    )
                                }
                            >
                                {i18n('problems')}
                            </Checkbox>
                        </Flex>
                        {(nodeId !== undefined || pdiskId !== undefined) && (
                            <Flex alignItems="center" gap={2}>
                                {nodeId !== undefined && (
                                    <Text>{i18n('location-node', {nodeId})}</Text>
                                )}
                                {pdiskId !== undefined && (
                                    <Text>{i18n('location-pdisk', {pdiskId})}</Text>
                                )}
                                <Button
                                    view="flat"
                                    onClick={() =>
                                        setQuery(
                                            {ddisksNodeId: undefined, ddisksPDiskId: undefined},
                                            'replaceIn',
                                        )
                                    }
                                >
                                    {i18n('clear-location')}
                                </Button>
                            </Flex>
                        )}
                        {!disks && <Text color="secondary">{i18n('usage-help')}</Text>}
                    </Flex>
                }
                table={
                    groupBy ? (
                        <LoaderWrapper loading={!currentData && isFetching}>
                            <React.Fragment>
                                {Boolean(error) && <ResponseError error={error} />}
                                {groups?.map(({name, count}) => (
                                    <TableGroup
                                        key={name}
                                        title={groupTitle(name)}
                                        count={count}
                                        entityName={i18n(disks ? 'ddisks' : 'nbs-tablets')}
                                        expanded={Boolean(expandedGroups[name])}
                                        onIsExpandedChange={(_, expanded) =>
                                            setIsGroupExpanded(name, expanded)
                                        }
                                    >
                                        <PaginatedTableWithLayout
                                            inheritKeyboardNavigation
                                            table={table(name, count)}
                                            tableWrapperProps={{scrollContainerRef}}
                                        />
                                    </TableGroup>
                                ))}
                                {groups?.length === 0 && <Text>{i18n('empty')}</Text>}
                            </React.Fragment>
                        </LoaderWrapper>
                    ) : (
                        table()
                    )
                }
                tableWrapperProps={{scrollContainerRef, scrollDependencies: [filters]}}
            />
        </DrawerWrapper>
    );
}
