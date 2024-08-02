import {ArrowsRotateRight} from '@gravity-ui/icons';
import type {Column as DataTableColumn} from '@gravity-ui/react-data-table';
import {Icon, Label, Text} from '@gravity-ui/uikit';
import {skipToken} from '@reduxjs/toolkit/query';

import {ButtonWithConfirmDialog} from '../../components/ButtonWithConfirmDialog/ButtonWithConfirmDialog';
import {DeveloperUILinkButton} from '../../components/DeveloperUILinkButton/DeveloperUILinkButton';
import {EntityStatus} from '../../components/EntityStatus/EntityStatus';
import {ResponseError} from '../../components/Errors/ResponseError';
import {InternalLink} from '../../components/InternalLink';
import {ResizeableDataTable} from '../../components/ResizeableDataTable/ResizeableDataTable';
import {TableSkeleton} from '../../components/TableSkeleton/TableSkeleton';
import routes, {createHref} from '../../routes';
import {selectIsUserAllowedToMakeChanges} from '../../store/reducers/authentication/authentication';
import {selectTabletsWithFqdn, tabletsApi} from '../../store/reducers/tablets';
import {ETabletState} from '../../types/api/tablet';
import type {TTabletStateInfo} from '../../types/api/tablet';
import type {TabletsApiRequestParams} from '../../types/store/tablets';
import {cn} from '../../utils/cn';
import {DEFAULT_TABLE_SETTINGS, EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {calcUptime} from '../../utils/dataFormatters/dataFormatters';
import {createTabletDeveloperUIHref} from '../../utils/developerUI/developerUI';
import {useAutoRefreshInterval, useTypedDispatch, useTypedSelector} from '../../utils/hooks';
import {mapTabletStateToLabelTheme} from '../../utils/tablet';
import {getDefaultNodePath} from '../Node/NodePages';

import i18n from './i18n';

const b = cn('tablets');

const columns: DataTableColumn<TTabletStateInfo & {fqdn?: string}>[] = [
    {
        name: 'Type',
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

            const tabletPath = createHref(
                routes.tablet,
                {id: row.TabletId},
                {nodeId: row.NodeId, type: row.Type},
            );

            return (
                <EntityStatus
                    name={row.TabletId?.toString()}
                    path={tabletPath}
                    hasClipboardButton
                    showStatus={false}
                    additionalControls={
                        <DeveloperUILinkButton href={createTabletDeveloperUIHref(row.TabletId)} />
                    }
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
            return <Label theme={mapTabletStateToLabelTheme(row.State)}>{row.State}</Label>;
        },
    },
    {
        name: 'NodeId',
        get header() {
            return i18n('Node ID');
        },
        render: ({row}) => {
            const nodePath = row.NodeId === undefined ? undefined : getDefaultNodePath(row.NodeId);
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
            return calcUptime(row.ChangeTime);
        },
        sortAccessor: (row) => -Number(row.ChangeTime),
        align: 'right',
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

function TabletActions(tablet: TTabletStateInfo) {
    const isDisabledRestart = tablet.State === ETabletState.Stopped;
    const dispatch = useTypedDispatch();
    const isUserAllowedToMakeChanges = useTypedSelector(selectIsUserAllowedToMakeChanges);

    return (
        <ButtonWithConfirmDialog
            buttonView="outlined"
            dialogContent={i18n('dialog.kill')}
            onConfirmAction={() => {
                return window.api.killTablet(tablet.TabletId);
            }}
            onConfirmActionSuccess={() => {
                dispatch(tabletsApi.util.invalidateTags(['All']));
            }}
            buttonDisabled={isDisabledRestart || !isUserAllowedToMakeChanges}
            withPopover
            popoverContent={i18n('controls.kill-not-allowed')}
            popoverDisabled={isUserAllowedToMakeChanges}
        >
            <Icon data={ArrowsRotateRight} />
        </ButtonWithConfirmDialog>
    );
}

interface TabletsProps {
    path?: string;
    nodeId?: string | number;
    className?: string;
}

export function Tablets({nodeId, path, className}: TabletsProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();

    let params: TabletsApiRequestParams = {};
    const node = nodeId === undefined ? undefined : String(nodeId);
    if (node !== undefined) {
        params = {nodes: [String(node)]};
    } else if (path) {
        params = {path};
    }
    const {currentData, isFetching, error} = tabletsApi.useGetTabletsInfoQuery(
        Object.keys(params).length === 0 ? skipToken : params,
        {
            pollingInterval: autoRefreshInterval,
        },
    );

    const loading = isFetching && currentData === undefined;
    const tablets = useTypedSelector((state) => selectTabletsWithFqdn(state, params));

    if (loading) {
        return <TableSkeleton />;
    }

    return (
        <div className={b(null, className)}>
            {error ? <ResponseError error={error} /> : null}
            {currentData ? (
                <ResizeableDataTable
                    columns={columns}
                    data={tablets}
                    settings={DEFAULT_TABLE_SETTINGS}
                    emptyDataMessage={i18n('noTabletsData')}
                />
            ) : null}
        </div>
    );
}
