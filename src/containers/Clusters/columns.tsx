import React from 'react';

import {HelpPopover} from '@gravity-ui/components';
import DataTable from '@gravity-ui/react-data-table';
import type {Column} from '@gravity-ui/react-data-table';
import {ClipboardButton, Link as ExternalLink, Progress} from '@gravity-ui/uikit';

import {ProgressViewer} from '../../components/ProgressViewer/ProgressViewer';
import {UserCard} from '../../components/User/User';
import type {PreparedCluster} from '../../store/reducers/clusters/types';
import {formatStorageValuesToTb} from '../../utils/dataFormatters/dataFormatters';
import {getCleanBalancerValue, removeViewerPathname} from '../../utils/parseBalancer';
import {clusterTabsIds, getClusterPath} from '../Cluster/utils';

import {COLUMNS_NAMES, COLUMNS_TITLES} from './constants';
import i18n from './i18n';
import {b} from './shared';

const EMPTY_CELL = <span className={b('empty-cell')}>—</span>;

export const CLUSTERS_COLUMNS: Column<PreparedCluster>[] = [
    {
        name: COLUMNS_NAMES.TITLE,
        header: COLUMNS_TITLES[COLUMNS_NAMES.TITLE],
        width: 230,
        render: ({row}) => {
            const {balancer, name: clusterName} = row;

            const backend = balancer && removeViewerPathname(balancer);

            const clusterPath = getClusterPath(undefined, {backend, clusterName});

            const clusterStatus = row.cluster?.Overall;

            return (
                <div className={b('cluster')}>
                    {clusterStatus ? (
                        <ExternalLink href={clusterPath}>
                            <div
                                className={b('cluster-status', {
                                    type: clusterStatus && clusterStatus.toLowerCase(),
                                })}
                            />
                        </ExternalLink>
                    ) : (
                        <div className={b('cluster-status')}>
                            <HelpPopover
                                content={
                                    <span className={b('tooltip-content')}>
                                        {row.cluster?.error || i18n('tooltip_no-cluster-data')}
                                    </span>
                                }
                                offset={{left: 0}}
                            />
                        </div>
                    )}
                    <div className={b('cluster-name')}>
                        <ExternalLink href={clusterPath}>{row.title}</ExternalLink>
                    </div>
                </div>
            );
        },
        defaultOrder: DataTable.ASCENDING,
    },
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
            const {preparedVersions, versions = [], balancer, name: clusterName} = row;

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

            const backend = balancer && removeViewerPathname(balancer);

            return (
                preparedVersions.length > 0 && (
                    <ExternalLink
                        className={b('cluster-versions')}
                        href={getClusterPath(clusterTabsIds.versions, {backend, clusterName})}
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
        name: COLUMNS_NAMES.CLUSTER,
        header: COLUMNS_TITLES[COLUMNS_NAMES.CLUSTER],
        width: 120,
        sortable: false,
        render: ({row}) => {
            const dc = (row.cluster && row.cluster.DataCenters) || [];
            return <div className={b('cluster-dc')}>{dc.join(', ') || EMPTY_CELL}</div>;
        },
    },
    {
        name: COLUMNS_NAMES.SERVICE,
        header: COLUMNS_TITLES[COLUMNS_NAMES.SERVICE],
        width: 100,
        sortable: true,
    },
    {
        name: COLUMNS_NAMES.STATUS,
        header: COLUMNS_TITLES[COLUMNS_NAMES.STATUS],
        width: 150,
        sortable: true,
    },
    {
        name: COLUMNS_NAMES.NODES,
        header: COLUMNS_TITLES[COLUMNS_NAMES.NODES],
        width: 150,
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

            return <ProgressViewer value={NodesAlive} capacity={NodesTotal} />;
        },
    },
    {
        name: COLUMNS_NAMES.LOAD,
        header: COLUMNS_TITLES[COLUMNS_NAMES.LOAD],
        width: 150,
        defaultOrder: DataTable.DESCENDING,
        sortAccessor: ({cluster}) => {
            return cluster?.NumberOfCpus;
        },
        render: ({row}) => {
            const {LoadAverage = 0, NumberOfCpus = 0, Overall} = row.cluster || {};

            if (!Overall) {
                return EMPTY_CELL;
            }

            return <ProgressViewer value={LoadAverage} capacity={NumberOfCpus} />;
        },
    },
    {
        name: COLUMNS_NAMES.STORAGE,
        header: COLUMNS_TITLES[COLUMNS_NAMES.STORAGE],
        width: 150,
        defaultOrder: DataTable.DESCENDING,
        sortAccessor: ({cluster}) => {
            return Number(cluster?.StorageTotal);
        },
        render: ({row}) => {
            const {StorageUsed = 0, StorageTotal = 0, Overall} = row.cluster || {};

            if (!Overall) {
                return EMPTY_CELL;
            }

            return (
                <ProgressViewer
                    value={StorageUsed}
                    capacity={StorageTotal}
                    formatValues={formatStorageValuesToTb}
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
        name: COLUMNS_NAMES.OWNER,
        header: COLUMNS_TITLES[COLUMNS_NAMES.OWNER],
        sortable: false,
        width: 120,
        render: ({row}) => {
            const logins = row.owner?.split(', ');
            return logins?.length
                ? logins.map((login) => <UserCard key={login} login={login} />)
                : EMPTY_CELL;
        },
    },
    {
        name: COLUMNS_NAMES.DESCRIPTION,
        header: COLUMNS_TITLES[COLUMNS_NAMES.DESCRIPTION],
        sortable: false,
        width: 150,
        render: ({row}) => {
            return row.description ? (
                <div className={b('description')}>{row.description}</div>
            ) : (
                EMPTY_CELL
            );
        },
    },
    {
        name: COLUMNS_NAMES.BALANCER,
        header: COLUMNS_TITLES[COLUMNS_NAMES.BALANCER],
        sortable: false,
        width: 290,
        render: ({row}) => {
            if (!row.balancer) {
                return EMPTY_CELL;
            }

            const cleanedValue = getCleanBalancerValue(row.balancer);
            return (
                <div className={b('balancer-cell')}>
                    <div className={b('balancer-text')}>{cleanedValue}</div>
                    <ClipboardButton size="s" text={cleanedValue} className={b('balancer-icon')} />
                </div>
            );
        },
    },
];
