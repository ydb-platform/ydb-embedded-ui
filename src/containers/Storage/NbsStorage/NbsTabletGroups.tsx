import React from 'react';

import {Flex, Select, Text} from '@gravity-ui/uikit';

import {DDisk} from '../../../components/DDisk/DDisk';
import {ResponseError} from '../../../components/Errors/ResponseError/ResponseError';
import {LoaderWrapper} from '../../../components/LoaderWrapper/LoaderWrapper';
import {PAGINATED_TABLE_IDS, PaginatedTable} from '../../../components/PaginatedTable';
import type {Column, FetchData} from '../../../components/PaginatedTable';
import {PaginatedTableWithLayout} from '../../../components/PaginatedTable/PaginatedTableWithLayout';
import {backend, clusterName, environment} from '../../../store';
import type {prepareTabletGroups} from '../../../store/reducers/storage/getNbsTabletGroups';
import {diskKey, isAllocated} from '../../../store/reducers/storage/getNbsTabletGroups';
import {storageApi} from '../../../store/reducers/storage/storage';
import type {NbsDisk} from '../../../types/api/nbs';
import {cn} from '../../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../../utils/constants';
import {useAutoRefreshInterval} from '../../../utils/hooks';

import i18n from './i18n';

import './NbsTabletGroups.scss';

const b = cn('ydb-nbs-tablet-groups');
type Group = ReturnType<typeof prepareTabletGroups>[number];

export function NbsTabletGroups({
    tabletId,
    mode,
    onModeChange,
}: {
    tabletId: string;
    mode: 'all' | 'degraded';
    onModeChange: (value: string) => void;
}) {
    const [interval] = useAutoRefreshInterval();
    const {currentData, error, isFetching, fulfilledTimeStamp} =
        storageApi.useGetNbsTabletDetailsQuery(
            {tabletId, backend, clusterName, environment},
            {
                pollingInterval: interval,
            },
        );
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const filters = React.useMemo(
        () => ({mode, tabletId, backend, clusterName, environment, updatedAt: fulfilledTimeStamp}),
        [mode, tabletId, fulfilledTimeStamp],
    );
    const fetchData = React.useCallback<FetchData<Group, typeof filters>>(
        async ({offset = 0, limit = 20, filters: selected}) => {
            const rows = (currentData?.groups ?? []).filter(
                (group) => selected?.mode !== 'degraded' || group.Degrade > 0,
            );
            return {
                data: rows.slice(offset, offset + limit),
                total: rows.length,
                found: rows.length,
            };
        },
        [currentData],
    );
    const columns = React.useMemo<Column<Group>[]>(() => {
        const disks = new Map(
            (currentData?.disks ?? []).map((disk) => [diskKey(disk.DiskId), disk]),
        );
        const renderDisks = (ids: NbsDisk['DiskId'][] = []) => {
            const allocated = ids.filter(isAllocated);
            return allocated.length ? (
                <Flex gap={1}>
                    {allocated.map((id, index) => {
                        const disk = disks.get(diskKey(id));
                        return (
                            <div className={b('disk')} key={diskKey(id) + ':' + index}>
                                <DDisk
                                    compact
                                    data={{
                                        ...disk,
                                        ...id,
                                        HasWhiteboardData: disk?.Available !== false,
                                    }}
                                />
                            </div>
                        );
                    })}
                </Flex>
            ) : (
                EMPTY_DATA_PLACEHOLDER
            );
        };
        return [
            {
                align: 'left',
                name: 'group',
                header: i18n('group-id'),
                width: 130,
                render: ({row}) => row.DirectBlockGroupId ?? EMPTY_DATA_PLACEHOLDER,
            },
            {
                align: 'left',
                name: 'degrade',
                header: i18n('degrade'),
                width: 110,
                render: ({row}) => row.Degrade,
            },
            {
                align: 'left',
                name: 'vchunks',
                header: i18n('vchunks'),
                width: 110,
                render: ({row}) => row.NumVChunksClaimed ?? EMPTY_DATA_PLACEHOLDER,
            },
            {
                align: 'left',
                name: 'disks',
                header: i18n('disk'),
                width: 200,
                render: ({row}) => renderDisks(row.DDiskId),
            },
            {
                align: 'left',
                name: 'buffers',
                header: i18n('buffer'),
                width: 200,
                render: ({row}) => renderDisks(row.PersistentBufferDDiskId),
            },
        ];
    }, [currentData]);
    return (
        <div className={b()}>
            <Flex alignItems="center" gap={2} className={b('controls')}>
                <Text>{i18n('show-group-mode')}</Text>
                <Select
                    aria-label={i18n('show-group-mode')}
                    value={[mode]}
                    options={[
                        {value: 'all', content: i18n('all-groups')},
                        {value: 'degraded', content: i18n('degraded-groups')},
                    ]}
                    onUpdate={([value]) => onModeChange(value)}
                />
            </Flex>
            <div className={b('table')} ref={scrollContainerRef}>
                <LoaderWrapper loading={!currentData && isFetching}>
                    {error ? (
                        <ResponseError error={error} />
                    ) : currentData ? (
                        <PaginatedTableWithLayout
                            table={
                                <PaginatedTable<Group, typeof filters>
                                    tableName={PAGINATED_TABLE_IDS.NBS_TABLET_GROUPS}
                                    columns={columns}
                                    fetchData={fetchData}
                                    filters={filters}
                                    scrollContainerRef={scrollContainerRef}
                                    getKeyboardRowKey={(row) => String(row.DirectBlockGroupId)}
                                    renderEmptyDataMessage={() =>
                                        i18n(
                                            mode === 'degraded'
                                                ? 'empty-degraded-groups'
                                                : 'empty-groups',
                                        )
                                    }
                                />
                            }
                            tableWrapperProps={{scrollContainerRef}}
                        />
                    ) : null}
                </LoaderWrapper>
            </div>
        </div>
    );
}
