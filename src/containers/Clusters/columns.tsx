import React from 'react';

import {Pencil, TrashBin} from '@gravity-ui/icons';
import DataTable from '@gravity-ui/react-data-table';
import type {Column} from '@gravity-ui/react-data-table';
import type {DropdownMenuItem} from '@gravity-ui/uikit';
import {
    ClipboardButton,
    DropdownMenu,
    Link as ExternalLink,
    Flex,
    Label,
    Progress,
    Text,
} from '@gravity-ui/uikit';

import {EntityStatus} from '../../components/EntityStatusNew/EntityStatus';
import type {PreparedCluster} from '../../store/reducers/clusters/types';
import {EFlag} from '../../types/api/enums';
import {uiFactory} from '../../uiFactory/uiFactory';
import {formatNumber, formatStorageValuesToTb} from '../../utils/dataFormatters/dataFormatters';
import {createDeveloperUIMonitoringPageHref} from '../../utils/developerUI/developerUI';
import {getCleanBalancerValue} from '../../utils/parseBalancer';
import {clusterTabsIds, getClusterPath} from '../Cluster/utils';

import {COLUMNS_NAMES, COLUMNS_TITLES} from './constants';
import i18n from './i18n';
import {b} from './shared';

export const CLUSTERS_COLUMNS_WIDTH_LS_KEY = 'clustersTableColumnsWidth';

const EMPTY_CELL = <span className={b('empty-cell')}>—</span>;

interface ClustersColumnsParams {
    isEditClusterAvailable?: boolean;
    isDeleteClusterAvailable?: boolean;
}

function getTitleColumn({isEditClusterAvailable, isDeleteClusterAvailable}: ClustersColumnsParams) {
    return {
        name: COLUMNS_NAMES.TITLE,
        header: COLUMNS_TITLES[COLUMNS_NAMES.TITLE],
        width: 320,
        defaultOrder: DataTable.ASCENDING,
        sortAccessor: (row) => row.title || row.name,
        render: ({row}) => {
            const {
                name: clusterName,
                use_embedded_ui: useEmbeddedUi,
                preparedBackend: backend,
            } = row;

            const clusterPath =
                useEmbeddedUi && backend
                    ? createDeveloperUIMonitoringPageHref(backend)
                    : getClusterPath(undefined, {backend, clusterName}, {withBasename: true});

            const clusterStatus = row.cluster?.Overall;

            const cleanedBalancer = row.balancer ? getCleanBalancerValue(row.balancer) : null;

            const renderActions = () => {
                const menuItems: (DropdownMenuItem | DropdownMenuItem[])[] = [];

                const {onEditCluster, onDeleteCluster} = uiFactory;

                if (isEditClusterAvailable && onEditCluster) {
                    menuItems.push({
                        text: i18n('edit-cluster'),
                        iconStart: <Pencil />,
                        action: () => {
                            onEditCluster({clusterData: row});
                        },
                    });
                }
                if (isDeleteClusterAvailable && onDeleteCluster) {
                    menuItems.push({
                        text: i18n('remove-cluster'),
                        iconStart: <TrashBin />,
                        action: () => {
                            onDeleteCluster({clusterData: row});
                        },
                        className: b('remove-cluster'),
                    });
                }

                if (!menuItems.length) {
                    return null;
                }

                return (
                    <DropdownMenu
                        items={menuItems}
                        defaultSwitcherProps={{view: 'flat-secondary', size: 'xs'}}
                        size="s"
                        menuProps={{size: 'l'}}
                    />
                );
            };

            const renderName = () => {
                return (
                    <div className={b('cluster-name')}>
                        <ExternalLink href={clusterPath}>{row.title || row.name}</ExternalLink>
                    </div>
                );
            };

            const renderStatus = () => {
                if (clusterStatus) {
                    return <EntityStatus.Label status={clusterStatus} size="xs" />;
                }
                return (
                    <EntityStatus.Label
                        status={EFlag.Grey}
                        note={row.cluster?.error || i18n('tooltip_no-cluster-data')}
                        size="xs"
                    />
                );
            };

            const renderBalancer = () => {
                if (!cleanedBalancer) {
                    return null;
                }

                return (
                    <Flex gap={0.5} alignItems={'center'}>
                        <Text variant="caption-2" color="secondary">
                            {cleanedBalancer}
                        </Text>
                        <ClipboardButton
                            size="xs"
                            text={cleanedBalancer}
                            className={b('balancer-copy-icon')}
                        />
                    </Flex>
                );
            };

            return (
                <Flex direction={'column'} gap={0.5}>
                    <Flex alignItems={'flex-start'} justifyContent={'space-between'} gap={1}>
                        {renderName()}
                        <Flex gap={1}>
                            {renderStatus()}
                            {renderActions()}
                        </Flex>
                    </Flex>
                    {renderBalancer()}
                </Flex>
            );
        },
    } satisfies Column<PreparedCluster>;
}

const CLUSTERS_COLUMNS: Column<PreparedCluster>[] = [
    {
        name: COLUMNS_NAMES.VERSIONS,
        header: COLUMNS_TITLES[COLUMNS_NAMES.VERSIONS],
        width: 300,
        defaultOrder: DataTable.DESCENDING,
        sortAccessor: ({preparedVersions}) => {
            const versions = preparedVersions
                .map((item) => item.version.replace(/^[0-9]\+\./g, ''))
                .sort((v1, v2) => v1.localeCompare(v2));

            return versions[0] || undefined;
        },
        render: ({row}) => {
            const {
                preparedVersions,
                versions = [],
                name: clusterName,
                preparedBackend: backend,
            } = row;

            const hasErrors = !versions.length || versions.some((item) => !item.version);

            if (hasErrors) {
                return EMPTY_CELL;
            }

            const total = versions.reduce((acc, item) => acc + item.count, 0);
            const versionsValues = versions.map((item) => {
                return {
                    value: (item.count / total) * 100,
                    color: preparedVersions.find(
                        (versionItem) => versionItem.version === item.version,
                    )?.color,
                };
            });

            return (
                preparedVersions.length > 0 && (
                    <ExternalLink
                        className={b('cluster-versions')}
                        href={getClusterPath(
                            clusterTabsIds.versions,
                            {backend, clusterName},
                            {withBasename: true},
                        )}
                    >
                        <React.Fragment>
                            {preparedVersions.map((item, index) => (
                                <div
                                    className={b('cluster-version')}
                                    style={{color: item.color}}
                                    key={index}
                                    title={item.version}
                                >
                                    {item.version}
                                </div>
                            ))}
                            {<Progress size="s" value={100} stack={versionsValues} />}
                        </React.Fragment>
                    </ExternalLink>
                )
            );
        },
    },
    {
        name: COLUMNS_NAMES.STATUS,
        header: COLUMNS_TITLES[COLUMNS_NAMES.STATUS],
        width: 180,
        sortable: true,
        render: ({row}) => {
            return <Label>{row.status}</Label>;
        },
    },
    {
        name: COLUMNS_NAMES.SERVICE,
        header: COLUMNS_TITLES[COLUMNS_NAMES.SERVICE],
        width: 100,
        sortable: true,
    },
    {
        name: COLUMNS_NAMES.DC,
        header: COLUMNS_TITLES[COLUMNS_NAMES.DC],
        width: 120,
        sortable: false,
        render: ({row}) => {
            const dc = (row.cluster && row.cluster.DataCenters) || [];
            return (
                // For some reason DC list could contain empty strings
                <div className={b('cluster-dc')}>{dc.filter(Boolean).join(', ') || EMPTY_CELL}</div>
            );
        },
    },
    {
        name: COLUMNS_NAMES.NODES,
        header: COLUMNS_TITLES[COLUMNS_NAMES.NODES],
        width: 170,
        resizeMinWidth: 170,
        defaultOrder: DataTable.DESCENDING,
        sortAccessor: ({cluster = {}}) => {
            const {NodesTotal = 0} = cluster;

            return NodesTotal;
        },
        render: ({row}) => {
            const {NodesAlive = 0, NodesTotal = 0, Overall} = row.cluster || {};

            if (!Overall) {
                return EMPTY_CELL;
            }

            return (
                <ClustersTableProgressBar
                    value={NodesAlive}
                    capacity={NodesTotal}
                    description={i18n('entities-count', {
                        value: formatNumber(NodesAlive),
                        capacity: formatNumber(NodesTotal),
                    })}
                />
            );
        },
    },
    {
        name: COLUMNS_NAMES.LOAD,
        header: COLUMNS_TITLES[COLUMNS_NAMES.LOAD],
        width: 170,
        resizeMinWidth: 170,
        defaultOrder: DataTable.DESCENDING,
        sortAccessor: ({cluster}) => {
            return cluster?.NumberOfCpus || 0;
        },
        render: ({row}) => {
            const {
                LoadAverage = 0,
                NumberOfCpus = 0,
                RealNumberOfCpus,
                Overall,
            } = row.cluster || {};

            if (!Overall) {
                return EMPTY_CELL;
            }

            return (
                <ClustersTableProgressBar
                    value={LoadAverage}
                    capacity={RealNumberOfCpus ?? NumberOfCpus}
                    description={i18n('entities-count', {
                        value: formatNumber(Math.round(LoadAverage)),
                        capacity: formatNumber(RealNumberOfCpus ?? NumberOfCpus),
                    })}
                />
            );
        },
    },
    {
        name: COLUMNS_NAMES.STORAGE,
        header: COLUMNS_TITLES[COLUMNS_NAMES.STORAGE],
        width: 170,
        resizeMinWidth: 170,
        defaultOrder: DataTable.DESCENDING,
        sortAccessor: ({cluster}) => {
            return Number(cluster?.StorageTotal) || 0;
        },
        render: ({row}) => {
            const {StorageUsed = 0, StorageTotal = 0, Overall} = row.cluster || {};

            if (!Overall) {
                return EMPTY_CELL;
            }

            const [valueString, capacityString] = formatStorageValuesToTb(
                Number(StorageUsed),
                Number(StorageTotal),
            );

            return (
                <ClustersTableProgressBar
                    value={Number(StorageUsed)}
                    capacity={Number(StorageTotal)}
                    description={i18n('entities-count', {
                        value: valueString,
                        capacity: capacityString,
                    })}
                />
            );
        },
    },
    {
        name: COLUMNS_NAMES.HOSTS,
        header: COLUMNS_TITLES[COLUMNS_NAMES.HOSTS],
        width: 80,
        defaultOrder: DataTable.DESCENDING,
        sortAccessor: ({cluster}) => {
            return Number(cluster?.Hosts) || 0;
        },
        render: ({row}) => {
            return Number(row.cluster?.Hosts) || EMPTY_CELL;
        },
    },
    {
        name: COLUMNS_NAMES.TENANTS,
        header: COLUMNS_TITLES[COLUMNS_NAMES.TENANTS],
        width: 80,
        defaultOrder: DataTable.DESCENDING,
        sortAccessor: ({cluster}) => {
            return Number(cluster?.Tenants) || 0;
        },
        render: ({row}) => {
            return Number(row.cluster?.Tenants) || EMPTY_CELL;
        },
    },
    {
        name: COLUMNS_NAMES.DESCRIPTION,
        header: COLUMNS_TITLES[COLUMNS_NAMES.DESCRIPTION],
        sortable: false,
        width: 200,
        render: ({row}) => {
            return row.description ? (
                <div className={b('description')}>{row.description}</div>
            ) : (
                EMPTY_CELL
            );
        },
    },
];

export function getClustersColumns(params: ClustersColumnsParams) {
    return [getTitleColumn(params), ...CLUSTERS_COLUMNS];
}

function ClustersTableProgressBar({
    value,
    capacity,
    description,
}: {
    value: number;
    capacity: number;
    description?: string;
}) {
    const usage = capacity ? (value / capacity) * 100 : 0;

    return (
        <Flex direction={'column'} gap={2}>
            <div>
                <Progress theme="success" size="s" value={usage} className={b('progress')} />
            </div>
            {description}
        </Flex>
    );
}
