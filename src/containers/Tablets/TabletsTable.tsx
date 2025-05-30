import React from 'react';

import {ArrowRotateLeft} from '@gravity-ui/icons';
import type {Column as DataTableColumn} from '@gravity-ui/react-data-table';
import {Icon, Text} from '@gravity-ui/uikit';
import {StringParam, useQueryParams} from 'use-query-params';

import {ButtonWithConfirmDialog} from '../../components/ButtonWithConfirmDialog/ButtonWithConfirmDialog';
import {EntitiesCount} from '../../components/EntitiesCount';
import {EntityStatus} from '../../components/EntityStatus/EntityStatus';
import {ResponseError} from '../../components/Errors/ResponseError';
import {InternalLink} from '../../components/InternalLink';
import {ResizeableDataTable} from '../../components/ResizeableDataTable/ResizeableDataTable';
import {Search} from '../../components/Search/Search';
import {TableWithControlsLayout} from '../../components/TableWithControlsLayout/TableWithControlsLayout';
import {TabletNameWrapper} from '../../components/TabletNameWrapper/TabletNameWrapper';
import {TabletState} from '../../components/TabletState/TabletState';
import {TabletUptime} from '../../components/UptimeViewer/UptimeViewer';
import {tabletApi} from '../../store/reducers/tablet';
import {ETabletState} from '../../types/api/tablet';
import type {TTabletStateInfo} from '../../types/api/tablet';
import {DEFAULT_TABLE_SETTINGS, EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {useIsUserAllowedToMakeChanges} from '../../utils/hooks/useIsUserAllowedToMakeChanges';
import {getDefaultNodePath} from '../Node/NodePages';

import i18n from './i18n';

function getColumns({database}: {database?: string}) {
    const columns: DataTableColumn<TTabletStateInfo & {fqdn?: string}>[] = [
        {
            name: 'Type',
            width: 150,
            get header() {
                return i18n('Type');
            },
            render: ({row}) => {
                const isFollower = row.Leader === false;
                return (
                    <span>
                        {row.Type} {isFollower ? <Text color="secondary">follower</Text> : ''}
                    </span>
                );
            },
        },
        {
            name: 'TabletId',
            width: 220,
            get header() {
                return i18n('Tablet');
            },
            render: ({row}) => {
                if (!row.TabletId) {
                    return EMPTY_DATA_PLACEHOLDER;
                }

                return (
                    <TabletNameWrapper
                        tabletId={row.TabletId}
                        database={database}
                        followerId={row.FollowerId || undefined}
                    />
                );
            },
        },
        {
            name: 'State',
            get header() {
                return i18n('State');
            },
            render: ({row}) => {
                return <TabletState state={row.State} />;
            },
        },
        {
            name: 'NodeId',
            get header() {
                return i18n('Node ID');
            },
            render: ({row}) => {
                const nodePath =
                    row.NodeId === undefined ? undefined : getDefaultNodePath(row.NodeId);
                return <InternalLink to={nodePath}>{row.NodeId}</InternalLink>;
            },
            align: 'right',
        },
        {
            name: 'fqdn',
            get header() {
                return i18n('Node FQDN');
            },
            render: ({row}) => {
                if (!row.fqdn) {
                    return <span>—</span>;
                }
                return <EntityStatus name={row.fqdn} showStatus={false} hasClipboardButton />;
            },
        },
        {
            name: 'Generation',
            get header() {
                return i18n('Generation');
            },
            align: 'right',
        },
        {
            name: 'Uptime',
            get header() {
                return i18n('Uptime');
            },
            render: ({row}) => {
                return <TabletUptime ChangeTime={row.ChangeTime} />;
            },
            sortAccessor: (row) => -Number(row.ChangeTime),
            align: 'right',
            width: 120,
        },
        {
            name: 'Actions',
            sortable: false,
            resizeable: false,
            header: '',
            render: ({row}) => {
                return <TabletActions {...row} />;
            },
        },
    ];
    return columns;
}

function TabletActions(tablet: TTabletStateInfo) {
    const isDisabledRestart = tablet.State === ETabletState.Stopped;
    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();
    const [killTablet] = tabletApi.useKillTabletMutation();

    const id = tablet.TabletId;
    if (!id) {
        return null;
    }

    return (
        <ButtonWithConfirmDialog
            buttonView="outlined"
            buttonTitle={i18n('dialog.kill-header')}
            dialogHeader={i18n('dialog.kill-header')}
            dialogText={i18n('dialog.kill-text')}
            onConfirmAction={() => {
                return killTablet({id}).unwrap();
            }}
            buttonDisabled={isDisabledRestart || !isUserAllowedToMakeChanges}
            withPopover
            popoverContent={
                isUserAllowedToMakeChanges
                    ? i18n('dialog.kill-header')
                    : i18n('controls.kill-not-allowed')
            }
            popoverPlacement={['right', 'auto']}
            popoverDisabled={false}
        >
            <Icon data={ArrowRotateLeft} />
        </ButtonWithConfirmDialog>
    );
}

interface TabletsTableProps {
    database?: string;
    tablets: (TTabletStateInfo & {
        fqdn?: string;
    })[];
    className?: string;
    loading?: boolean;
    error?: unknown;
    scrollContainerRef: React.RefObject<HTMLElement>;
}

export function TabletsTable({
    database,
    tablets,
    loading,
    error,
    scrollContainerRef,
}: TabletsTableProps) {
    const [{tabletsSearch}, setQueryParams] = useQueryParams({
        tabletsSearch: StringParam,
    });

    const columns = React.useMemo(() => getColumns({database}), [database]);

    const filteredTablets = React.useMemo(() => {
        return tablets.filter((tablet) => {
            return String(tablet.TabletId).includes(tabletsSearch ?? '');
        });
    }, [tablets, tabletsSearch]);

    const handleSearchQueryChange = (value: string) => {
        setQueryParams({tabletsSearch: value || undefined}, 'replaceIn');
    };

    return (
        <TableWithControlsLayout fullHeight>
            <TableWithControlsLayout.Controls>
                <Search
                    placeholder={i18n('controls.search-placeholder')}
                    onChange={handleSearchQueryChange}
                    value={tabletsSearch ?? ''}
                    width={238}
                />
                <EntitiesCount
                    label={i18n('controls.entities-count-label')}
                    loading={loading}
                    total={tablets.length}
                    current={filteredTablets.length}
                />
            </TableWithControlsLayout.Controls>
            {error ? <ResponseError error={error} /> : null}
            <TableWithControlsLayout.Table
                scrollContainerRef={scrollContainerRef}
                scrollDependencies={[tabletsSearch]}
                loading={loading}
            >
                {({onSort}) => (
                    <ResizeableDataTable
                        columns={columns}
                        data={filteredTablets}
                        settings={DEFAULT_TABLE_SETTINGS}
                        emptyDataMessage={i18n('noTabletsData')}
                        onSort={onSort}
                    />
                )}
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
}
