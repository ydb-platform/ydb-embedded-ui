import React from 'react';

import {Flex, Label, Select, Text} from '@gravity-ui/uikit';

import {DDisk} from '../../../components/DDisk/DDisk';
import {ResponseError} from '../../../components/Errors/ResponseError/ResponseError';
import {LoaderWrapper} from '../../../components/LoaderWrapper/LoaderWrapper';
import {PAGINATED_TABLE_IDS, PaginatedTable} from '../../../components/PaginatedTable';
import type {Column, FetchData} from '../../../components/PaginatedTable';
import {PaginatedTableWithLayout} from '../../../components/PaginatedTable/PaginatedTableWithLayout';
import {backend, clusterName, environment} from '../../../store';
import type {NbsTabletGroup} from '../../../store/reducers/storage/getNbsTabletGroups';
import {diskKey} from '../../../store/reducers/storage/getNbsTabletGroups';
import {storageApi} from '../../../store/reducers/storage/storage';
import {cn} from '../../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../../utils/constants';
import {useAutoRefreshInterval} from '../../../utils/hooks';

import i18n from './i18n';

import './NbsTabletGroups.scss';

const b = cn('ydb-nbs-tablet-groups');

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
    const scope = JSON.stringify([backend, clusterName, environment]);
    const filters = React.useMemo(
        () => ({mode, tabletId, scope, updatedAt: fulfilledTimeStamp}),
        [mode, tabletId, scope, fulfilledTimeStamp],
    );
    const rows = React.useMemo(() => {
        const groups = currentData?.groups ?? [];
        return mode === 'degraded'
            ? groups.filter(
                  (group) =>
                      group.disks.unavailable > 0 ||
                      group.buffers.unavailable > 0 ||
                      group.quorum === 'NoQuorum',
              )
            : groups;
    }, [currentData, mode]);
    const fetchData = React.useCallback<FetchData<NbsTabletGroup, typeof filters>>(
        async ({offset = 0, limit = 20}) => {
            return {
                data: rows.slice(offset, offset + limit),
                total: currentData?.groups.length ?? 0,
                found: rows.length,
            };
        },
        [currentData, rows],
    );
    const slots = currentData?.slots;
    const columns = React.useMemo<Column<NbsTabletGroup>[]>(() => {
        const renderMembers = (
            role: 'ddisk' | 'buffer',
            {ids, unavailable, unknown}: NbsTabletGroup['disks'],
        ) => {
            return (
                <Flex direction="column" gap={1}>
                    {ids.length ? (
                        <Flex gap={1}>
                            {ids.map((id, index) => {
                                const key = diskKey(id);
                                const disk = slots?.[key];
                                return (
                                    <div className={b('disk')} key={key + ':' + index}>
                                        <DDisk
                                            compact
                                            role={role}
                                            data={{
                                                ...id,
                                                ...disk,
                                                AllocatedSize: disk?.AllocatedSize?.toString(),
                                                AvailableSize: disk?.AvailableSize?.toString(),
                                                TotalSize: disk?.TotalSize?.toString(),
                                            }}
                                        />
                                    </div>
                                );
                            })}
                        </Flex>
                    ) : (
                        EMPTY_DATA_PLACEHOLDER
                    )}
                    <Text variant="caption-2" color="secondary">
                        {i18n('member-counts', {unavailable, unknown})}
                    </Text>
                </Flex>
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
                name: 'quorum',
                header: i18n('monitored-quorum'),
                width: 160,
                render: ({row}) => {
                    switch (row.quorum) {
                        case 'Quorum':
                            return <Label theme="success">{i18n('quorum')}</Label>;
                        case 'NoQuorum':
                            return <Label theme="danger">{i18n('no-quorum')}</Label>;
                        default:
                            return <Label>{i18n('unknown')}</Label>;
                    }
                },
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
                render: ({row}) => renderMembers('ddisk', row.disks),
            },
            {
                align: 'left',
                name: 'buffers',
                header: i18n('buffer'),
                width: 200,
                render: ({row}) => renderMembers('buffer', row.buffers),
            },
        ];
    }, [slots]);
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
                                <PaginatedTable<NbsTabletGroup, typeof filters>
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
