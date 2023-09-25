import cn from 'bem-cn-lite';

import DataTable, {Column} from '@gravity-ui/react-data-table';
import {Icon, Label, Popover, PopoverBehavior} from '@gravity-ui/uikit';

import shieldIcon from '../../../assets/icons/shield.svg';
import type {ValueOf} from '../../../types/common';
import type {NodesMap} from '../../../types/store/nodesList';
import type {PreparedStorageGroup} from '../../../store/reducers/storage/types';
import {getUsage, isFullVDiskData} from '../../../utils/storage';
import {bytesToGB, bytesToSpeed} from '../../../utils/utils';
import {stringifyVdiskId} from '../../../utils/dataFormatters/dataFormatters';
import EntityStatus from '../../../components/EntityStatus/EntityStatus';
import {Stack} from '../../../components/Stack/Stack';
import {VDisk} from '../VDisk';
import {getDegradedSeverity, getUsageSeverityForStorageGroup} from '../utils';
import i18n from './i18n';
import './StorageGroups.scss';

const b = cn('global-storage-groups');

const GROUPS_COLUMNS_IDS = {
    PoolName: 'PoolName',
    Kind: 'Kind',
    Erasure: 'Erasure',
    GroupId: 'GroupId',
    Used: 'Used',
    Limit: 'Limit',
    Usage: 'Usage',
    UsedSpaceFlag: 'UsedSpaceFlag',
    Read: 'Read',
    Write: 'Write',
    VDisks: 'VDisks',
    Degraded: 'Degraded',
} as const;

type GroupsColumns = ValueOf<typeof GROUPS_COLUMNS_IDS>;

const tableColumnsNames: Record<GroupsColumns, string> = {
    PoolName: 'Pool Name',
    Kind: 'Type',
    Erasure: 'Erasure',
    GroupId: 'Group ID',
    Used: 'Used',
    Limit: 'Limit',
    UsedSpaceFlag: 'Space',
    Usage: 'Usage',
    Read: 'Read',
    Write: 'Write',
    VDisks: 'VDisks',
    Degraded: 'Degraded',
};

export const getStorageGroupsColumns = (nodes?: NodesMap): Column<PreparedStorageGroup>[] => {
    const columns: Column<PreparedStorageGroup>[] = [
        {
            name: GROUPS_COLUMNS_IDS.PoolName,
            header: tableColumnsNames[GROUPS_COLUMNS_IDS.PoolName],
            width: 250,
            render: ({row}) => {
                const splitted = row.PoolName?.split('/');
                return (
                    <div className={b('pool-name-wrapper')}>
                        {splitted && (
                            <Popover
                                content={row.PoolName}
                                placement={['right']}
                                behavior={PopoverBehavior.Immediate}
                            >
                                <span className={b('pool-name')}>
                                    {splitted[splitted.length - 1]}
                                </span>
                            </Popover>
                        )}
                    </div>
                );
            },
            align: DataTable.LEFT,
            sortable: false,
        },
        {
            name: GROUPS_COLUMNS_IDS.Kind,
            header: tableColumnsNames[GROUPS_COLUMNS_IDS.Kind],
            // prettier-ignore
            render: ({row}) => (
                <>
                    <Label>{row.Kind || '—'}</Label>
                    {' '}
                    {row.Encryption && (
                        <Popover
                            content={i18n('encrypted')}
                            placement="right"
                            behavior={PopoverBehavior.Immediate}
                        >
                            <Label>
                                <Icon data={shieldIcon} />
                            </Label>
                        </Popover>
                    )}
                </>
            ),
            sortable: false,
        },
        {
            name: GROUPS_COLUMNS_IDS.Erasure,
            header: tableColumnsNames[GROUPS_COLUMNS_IDS.Erasure],
            render: ({row}) => (row.ErasureSpecies ? row.ErasureSpecies : '-'),
            align: DataTable.LEFT,
            sortable: false,
        },
        {
            name: GROUPS_COLUMNS_IDS.Degraded,
            header: tableColumnsNames[GROUPS_COLUMNS_IDS.Degraded],
            width: 100,
            render: ({row}) =>
                row.Degraded ? (
                    <Label theme={getDegradedSeverity(row)}>Degraded: {row.Degraded}</Label>
                ) : (
                    '-'
                ),
            align: DataTable.LEFT,
            defaultOrder: DataTable.DESCENDING,
            sortable: false,
        },
        {
            name: GROUPS_COLUMNS_IDS.Usage,
            header: tableColumnsNames[GROUPS_COLUMNS_IDS.Usage],
            width: 100,
            render: ({row}) => {
                // without a limit the usage can be evaluated as 0,
                // but the absence of a value is more clear
                return row.Limit ? (
                    <Label
                        theme={getUsageSeverityForStorageGroup(row.Usage)}
                        className={b('usage-label', {overload: row.Usage >= 90})}
                    >
                        {row.Usage}%
                    </Label>
                ) : (
                    '-'
                );
            },
            // without a limit exclude usage from sort to display at the bottom
            sortAccessor: (row) => (row.Limit ? getUsage(row) : null),
            align: DataTable.LEFT,
            sortable: false,
        },
        {
            name: GROUPS_COLUMNS_IDS.GroupId,
            header: tableColumnsNames[GROUPS_COLUMNS_IDS.GroupId],
            width: 130,
            render: ({row}) => {
                return <span className={b('group-id')}>{row.GroupID}</span>;
            },
            sortAccessor: (row) => Number(row.GroupID),
            align: DataTable.RIGHT,
            sortable: false,
        },
        {
            name: GROUPS_COLUMNS_IDS.Used,
            header: tableColumnsNames[GROUPS_COLUMNS_IDS.Used],
            width: 100,
            render: ({row}) => {
                return bytesToGB(row.Used, true);
            },
            align: DataTable.RIGHT,
            sortable: false,
        },
        {
            name: GROUPS_COLUMNS_IDS.Limit,
            header: tableColumnsNames[GROUPS_COLUMNS_IDS.Limit],
            width: 100,
            render: ({row}) => {
                return bytesToGB(row.Limit);
            },
            align: DataTable.RIGHT,
            sortable: false,
        },
        {
            name: GROUPS_COLUMNS_IDS.UsedSpaceFlag,
            header: tableColumnsNames[GROUPS_COLUMNS_IDS.UsedSpaceFlag],
            width: 110,
            render: ({row}) => {
                const value = row.UsedSpaceFlag;

                let color = 'Red';

                if (value < 100) {
                    color = 'Green';
                } else if (value < 10000) {
                    color = 'Yellow';
                } else if (value < 1000000) {
                    color = 'Orange';
                }
                return <EntityStatus status={color} />;
            },
            align: DataTable.CENTER,
            sortable: false,
        },

        {
            name: GROUPS_COLUMNS_IDS.Read,
            header: tableColumnsNames[GROUPS_COLUMNS_IDS.Read],
            width: 100,
            render: ({row}) => {
                return row.Read ? bytesToSpeed(row.Read) : '-';
            },
            align: DataTable.RIGHT,
            sortable: false,
        },
        {
            name: GROUPS_COLUMNS_IDS.Write,
            header: tableColumnsNames[GROUPS_COLUMNS_IDS.Write],
            width: 100,
            render: ({row}) => {
                return row.Write ? bytesToSpeed(row.Write) : '-';
            },
            align: DataTable.RIGHT,
            sortable: false,
        },
        {
            name: GROUPS_COLUMNS_IDS.VDisks,
            className: b('vdisks-column'),
            header: tableColumnsNames[GROUPS_COLUMNS_IDS.VDisks],
            render: ({row}) => (
                <div className={b('vdisks-wrapper')}>
                    {row.VDisks?.map((vDisk) => {
                        const donors = vDisk.Donors;

                        return donors && donors.length > 0 ? (
                            <Stack
                                className={b('vdisks-item')}
                                key={stringifyVdiskId(vDisk.VDiskId)}
                            >
                                <VDisk data={vDisk} nodes={nodes} />
                                {donors.map((donor) => {
                                    const isFullData = isFullVDiskData(donor);

                                    return (
                                        <VDisk
                                            data={isFullData ? donor : {...donor, DonorMode: true}}
                                            // donor and acceptor are always in the same group
                                            nodes={nodes}
                                            key={stringifyVdiskId(
                                                isFullData ? donor.VDiskId : donor,
                                            )}
                                        />
                                    );
                                })}
                            </Stack>
                        ) : (
                            <div className={b('vdisks-item')} key={stringifyVdiskId(vDisk.VDiskId)}>
                                <VDisk data={vDisk} nodes={nodes} />
                            </div>
                        );
                    })}
                </div>
            ),
            align: DataTable.CENTER,
            sortable: false,
            width: 900,
        },
    ];

    return columns;
};
