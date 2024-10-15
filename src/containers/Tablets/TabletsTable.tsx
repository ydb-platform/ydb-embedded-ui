import {ArrowsRotateRight} from '@gravity-ui/icons';
import type {Column as DataTableColumn} from '@gravity-ui/react-data-table';
import {Icon, Text} from '@gravity-ui/uikit';

import {ButtonWithConfirmDialog} from '../../components/ButtonWithConfirmDialog/ButtonWithConfirmDialog';
import {DeveloperUILinkButton} from '../../components/DeveloperUILinkButton/DeveloperUILinkButton';
import {EntityStatus} from '../../components/EntityStatus/EntityStatus';
import {InternalLink} from '../../components/InternalLink';
import {ResizeableDataTable} from '../../components/ResizeableDataTable/ResizeableDataTable';
import {TableSkeleton} from '../../components/TableSkeleton/TableSkeleton';
import {TabletState} from '../../components/TabletState/TabletState';
import {getTabletPagePath} from '../../routes';
import {selectIsUserAllowedToMakeChanges} from '../../store/reducers/authentication/authentication';
import {tabletApi} from '../../store/reducers/tablet';
import {ETabletState} from '../../types/api/tablet';
import type {TTabletStateInfo} from '../../types/api/tablet';
import {DEFAULT_TABLE_SETTINGS, EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {calcUptime} from '../../utils/dataFormatters/dataFormatters';
import {createTabletDeveloperUIHref} from '../../utils/developerUI/developerUI';
import {useTypedSelector} from '../../utils/hooks';
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

                const tabletPath = getTabletPagePath(row.TabletId, {
                    tenantName: database,
                });

                return (
                    <EntityStatus
                        name={row.TabletId?.toString()}
                        path={tabletPath}
                        hasClipboardButton
                        showStatus={false}
                        additionalControls={
                            <DeveloperUILinkButton
                                href={createTabletDeveloperUIHref(row.TabletId)}
                            />
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
    return columns;
}

function TabletActions(tablet: TTabletStateInfo) {
    const isDisabledRestart = tablet.State === ETabletState.Stopped;
    const isUserAllowedToMakeChanges = useTypedSelector(selectIsUserAllowedToMakeChanges);
    const [killTablet] = tabletApi.useKillTabletMutation();

    const id = tablet.TabletId;
    if (!id) {
        return null;
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
            popoverContent={i18n('controls.kill-not-allowed')}
            popoverDisabled={isUserAllowedToMakeChanges}
        >
            <Icon data={ArrowsRotateRight} />
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
}

export function TabletsTable({database, tablets, className, loading}: TabletsTableProps) {
    if (loading) {
        return <TableSkeleton />;
    }
    return (
        <ResizeableDataTable
            wrapperClassName={className}
            columns={getColumns({database})}
            data={tablets}
            settings={DEFAULT_TABLE_SETTINGS}
            emptyDataMessage={i18n('noTabletsData')}
        />
    );
}
