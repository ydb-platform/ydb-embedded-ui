import React from 'react';

import {ArrowRotateLeft} from '@gravity-ui/icons';
import type {Column as DataTableColumn, SortOrder} from '@gravity-ui/react-data-table';
import {Icon, Text} from '@gravity-ui/uikit';
import {isNil} from 'lodash';
import {StringParam, useQueryParams} from 'use-query-params';

import {ButtonWithConfirmDialog} from '../../components/ButtonWithConfirmDialog/ButtonWithConfirmDialog';
import {EntitiesCount} from '../../components/EntitiesCount';
import {EntityStatus} from '../../components/EntityStatus/EntityStatus';
import {ResponseError} from '../../components/Errors/ResponseError';
import {NodeId} from '../../components/NodeId/NodeId';
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

import i18n from './i18n';

function isFollowerTablet(state: TTabletStateInfo) {
    return state.Leader === false;
}

function getColumns({
    nodeId,
    showEndOfRange,
}: {
    nodeId?: string | number;
    showEndOfRange?: boolean;
}) {
    const columns: DataTableColumn<TTabletStateInfo & {fqdn?: string}>[] = [
        {
            name: 'Type',
            width: 150,
            get header() {
                return i18n('Type');
            },
            render: ({row}) => {
                const isFollower = isFollowerTablet(row);
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
    ];

    // For node page we don't need to show node columns
    if (nodeId === undefined) {
        columns.push(
            {
                name: 'NodeId',
                get header() {
                    return i18n('Node ID');
                },
                render: ({row}) => {
                    if (isNil(row.NodeId)) {
                        return EMPTY_DATA_PLACEHOLDER;
                    }
                    return <NodeId id={row.NodeId} />;
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
                        return EMPTY_DATA_PLACEHOLDER;
                    }
                    return <EntityStatus name={row.fqdn} showStatus={false} hasClipboardButton />;
                },
            },
        );
    }

    columns.push(
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
    );

    if (nodeId === undefined && showEndOfRange) {
        columns.push({
            name: 'EndOfRangeKeyPrefix',
            get header() {
                return i18n('End Range');
            },
            width: 350,
            render: ({row}) => {
                if (!row.EndOfRangeKeyPrefix) {
                    return EMPTY_DATA_PLACEHOLDER;
                }
                return row.EndOfRangeKeyPrefix;
            },
        });
    }

    columns.push({
        name: 'Actions',
        sortable: false,
        resizeable: false,
        header: '',
        render: ({row}) => {
            return <TabletActions {...row} />;
        },
    });

    return columns;
}

function TabletActions(tablet: TTabletStateInfo) {
    const isFollower = isFollowerTablet(tablet);
    const isDisabledRestart = tablet.State === ETabletState.Stopped || isFollower;
    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();
    const [killTablet] = tabletApi.useKillTabletMutation();

    const id = tablet.TabletId;
    if (!id) {
        return null;
    }

    let popoverContent: React.ReactNode;

    if (isFollower) {
        popoverContent = i18n('controls.kill-impossible-follower');
    } else if (!isUserAllowedToMakeChanges) {
        popoverContent = i18n('controls.kill-not-allowed');
    } else {
        popoverContent = i18n('dialog.kill-header');
    }

    return (
        <ButtonWithConfirmDialog
            buttonView="outlined"
            dialogHeader={i18n('dialog.kill-header')}
            dialogText={i18n('dialog.kill-text')}
            onConfirmAction={() => {
                return killTablet({id}).unwrap();
            }}
            buttonDisabled={isDisabledRestart || !isUserAllowedToMakeChanges}
            withPopover
            popoverContent={popoverContent}
            popoverPlacement={['right', 'bottom']}
            popoverDisabled={false}
        >
            <Icon data={ArrowRotateLeft} />
        </ButtonWithConfirmDialog>
    );
}

interface TabletsTableProps {
    tablets: (TTabletStateInfo & {
        fqdn?: string;
    })[];
    className?: string;
    loading?: boolean;
    error?: unknown;
    scrollContainerRef: React.RefObject<HTMLElement>;
    nodeId?: string | number;
}

export function TabletsTable({
    tablets,
    loading,
    error,
    scrollContainerRef,
    nodeId,
}: TabletsTableProps) {
    const [{tabletsSearch}, setQueryParams] = useQueryParams({
        tabletsSearch: StringParam,
    });

    // Track sort state for scroll dependencies
    const [sortParams, setSortParams] = React.useState<SortOrder | SortOrder[] | undefined>();

    const {filteredTablets, showEndOfRange} = React.useMemo(() => {
        let showEnd = false;
        return {
            filteredTablets: tablets.filter((tablet) => {
                showEnd = showEnd || Boolean(tablet.EndOfRangeKeyPrefix);
                return String(tablet.TabletId).includes(tabletsSearch ?? '');
            }),
            showEndOfRange: showEnd,
        };
    }, [tablets, tabletsSearch]);

    const columns = React.useMemo(
        () => getColumns({nodeId, showEndOfRange}),
        [nodeId, showEndOfRange],
    );

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
                scrollDependencies={[tabletsSearch, sortParams]}
                loading={loading}
            >
                <ResizeableDataTable
                    columns={columns}
                    data={filteredTablets}
                    settings={DEFAULT_TABLE_SETTINGS}
                    emptyDataMessage={i18n('noTabletsData')}
                    onSortChange={setSortParams}
                />
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
}
