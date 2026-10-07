import React from 'react';

import {Checkbox, Flex, Select, Text} from '@gravity-ui/uikit';
import {BooleanParam, StringParam, useQueryParams} from 'use-query-params';
import {z} from 'zod';

import {DrawerWrapper} from '../../../components/Drawer';
import {ResponseError} from '../../../components/Errors/ResponseError/ResponseError';
import {LoaderWrapper} from '../../../components/LoaderWrapper/LoaderWrapper';
import {PAGINATED_TABLE_IDS, PaginatedTable} from '../../../components/PaginatedTable';
import {PaginatedTableWithLayout} from '../../../components/PaginatedTable/PaginatedTableWithLayout';
import {Search} from '../../../components/Search/Search';
import {storageApi} from '../../../store/reducers/storage/storage';
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

export function NbsStorage({disks, scrollContainerRef}: PaginatedStorageProps & {disks: boolean}) {
    const {storageType, handleStorageTypeChange} = useStorageQueryParams();
    const [interval] = useAutoRefreshInterval();
    const [query, setQuery] = useQueryParams({
        nbsTabletGroups: StringParam,
        nbsGroupsMode: StringParam,
        nbsSearch: StringParam,
        ddisksSearch: StringParam,
        nbsGroupBy: StringParam,
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
    const groupBy =
        !disks && (query.nbsGroupBy === 'degrade' || query.nbsGroupBy === 'disk_usage')
            ? query.nbsGroupBy
            : undefined;
    const filters = React.useMemo<NbsFilters>(
        () => ({
            disks,
            filter: search,
            sort_by: sort,
            sort_desc: descending,
            only_problems: problems,
            group_by: groupBy,
        }),
        [disks, search, sort, descending, problems, groupBy],
    );
    const {currentData, error, isFetching} = storageApi.useGetNbsTabletGroupsQuery(
        {filter: search, only_problems: problems, group_by: groupBy},
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
        if (name === 'unknown') {
            return i18n('unknown');
        }
        if (groupBy === 'degrade') {
            return `${i18n('degrade')}: ${name}`;
        }
        return Number(name) === 100 ? '≥100%' : `${name}–${Number(name) + 10}%`;
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
                            {!disks && (
                                <React.Fragment>
                                    <Text>{i18n('group-by')}</Text>
                                    <Select
                                        aria-label={i18n('group-by')}
                                        value={[groupBy ?? '']}
                                        options={[
                                            {value: '', content: i18n('none')},
                                            {value: 'degrade', content: i18n('degrade')},
                                            {value: 'disk_usage', content: i18n('usage')},
                                        ]}
                                        onUpdate={([value]) =>
                                            setQuery({nbsGroupBy: value || undefined}, 'replaceIn')
                                        }
                                    />
                                </React.Fragment>
                            )}
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
                                        entityName={i18n('nbs-tablets')}
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
