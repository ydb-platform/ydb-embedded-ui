import {ArrowToggle, Button, Flex} from '@gravity-ui/uikit';
import type {CellContext, ColumnDef, Row} from '@tanstack/react-table';

import {formatTimestamp} from '../../../../utils/dataFormatters/dataFormatters';

import {tabletInfoKeyset} from './i18n';
import {b} from './shared';
import type {TabletStorageItem} from './types';

interface ColumnHeaderProps {
    name: string;
    className?: string;
}

function ColumnHeader({name, className}: ColumnHeaderProps) {
    return <div className={b('table-header-content', className)}>{name}</div>;
}

function metricsCell(
    info: CellContext<TabletStorageItem, unknown>,
    formatter?: (value: string | number) => string | number,
) {
    const value = info.getValue<string | number>();
    const formattedValue = typeof formatter === 'function' ? formatter(value) : value;

    return <div className={b('metrics-cell')}>{formattedValue}</div>;
}

interface GroupIdCellProps<TData> {
    row: Row<TData>;
    name?: string;
    hasExpand?: boolean;
}

function GroupIdCell<TData>({row, name, hasExpand}: GroupIdCellProps<TData>) {
    const isExpandable = row.getCanExpand();
    return (
        <Flex gap={1} alignItems="flex-start" className={b('name-wrapper')}>
            {isExpandable && (
                <Button view="flat" size="xs" onClick={row.getToggleExpandedHandler()}>
                    <Button.Icon>
                        <ArrowToggle
                            direction={row.getIsExpanded() ? 'bottom' : 'right'}
                            size={14}
                        />
                    </Button.Icon>
                </Button>
            )}
            <div className={b('name-content', {'no-control': hasExpand && !isExpandable})}>
                {name}
            </div>
        </Flex>
    );
}

export function getColumns(hasExpand?: boolean) {
    const columns: ColumnDef<TabletStorageItem>[] = [
        {
            accessorKey: 'channelIndex',
            header: () => <ColumnHeader name={tabletInfoKeyset('label_channel-index')} />,
            size: 50,
            cell: metricsCell,
            meta: {align: 'right'},
        },
        {
            accessorKey: 'storagePoolName',
            header: () => <ColumnHeader name={tabletInfoKeyset('label_storage-pool')} />,
            size: 200,
            cell: metricsCell,
        },
        {
            accessorKey: 'GroupID',
            header: () => (
                <ColumnHeader
                    name={tabletInfoKeyset('label_group-id')}
                    className={hasExpand ? b('with-padding') : undefined}
                />
            ),
            size: 100,
            cell: (info) => (
                <GroupIdCell row={info.row} name={info.getValue<string>()} hasExpand={hasExpand} />
            ),
        },
        {
            accessorKey: 'FromGeneration',
            header: () => <ColumnHeader name={tabletInfoKeyset('label_generation')} />,
            size: 100,
            cell: metricsCell,
            meta: {align: 'right'},
        },
        {
            accessorKey: 'Timestamp',
            header: () => <ColumnHeader name={tabletInfoKeyset('label_timestamp')} />,
            size: 200,
            cell: (info) => metricsCell(info, formatTimestamp),
            meta: {align: 'right'},
        },
    ];
    return columns;
}
