import {ContentWithPopup} from '../../../components/ContentWithPopup/ContentWithPopup';
import {ResponseError} from '../../../components/Errors/ResponseError';
import type {InfoViewerItem} from '../../../components/InfoViewer/InfoViewer';
import InfoViewer from '../../../components/InfoViewer/InfoViewer';
import {InfoViewerSkeleton} from '../../../components/InfoViewerSkeleton/InfoViewerSkeleton';
import {LinkWithIcon} from '../../../components/LinkWithIcon/LinkWithIcon';
import {ProgressViewer} from '../../../components/ProgressViewer/ProgressViewer';
import {Tablet} from '../../../components/Tablet';
import {Tags} from '../../../components/Tags';
import {backend, customBackend} from '../../../store';
import type {
    ClusterGroupsStats,
    DiskErasureGroupsStats,
    DiskGroupsStats,
} from '../../../store/reducers/cluster/types';
import type {AdditionalClusterProps, ClusterLink} from '../../../types/additionalProps';
import type {TClusterInfo} from '../../../types/api/cluster';
import type {IResponseError} from '../../../types/api/error';
import type {VersionValue} from '../../../types/versions';
import {formatBytes, getSizeWithSignificantDigits} from '../../../utils/bytesParsers';
import {cn} from '../../../utils/cn';
import {DEVELOPER_UI_TITLE} from '../../../utils/constants';
import {formatStorageValues} from '../../../utils/dataFormatters/dataFormatters';
import {useTypedSelector} from '../../../utils/hooks';
import {VersionsBar} from '../VersionsBar/VersionsBar';
import i18n from '../i18n';

import {compareTablets} from './utils';

import './ClusterInfo.scss';

const b = cn('cluster-info');

interface GroupsStatsPopupContentProps {
    stats: DiskErasureGroupsStats;
}

const GroupsStatsPopupContent = ({stats}: GroupsStatsPopupContentProps) => {
    const {diskType, erasure, allocatedSize, availableSize} = stats;

    const sizeToConvert = getSizeWithSignificantDigits(Math.max(allocatedSize, availableSize), 2);

    const convertedAllocatedSize = formatBytes({value: allocatedSize, size: sizeToConvert});
    const convertedAvailableSize = formatBytes({value: availableSize, size: sizeToConvert});

    const usage = Math.round((allocatedSize / (allocatedSize + availableSize)) * 100);

    const info = [
        {
            label: i18n('disk-type'),
            value: diskType,
        },
        {
            label: i18n('erasure'),
            value: erasure,
        },
        {
            label: i18n('allocated'),
            value: convertedAllocatedSize,
        },
        {
            label: i18n('available'),
            value: convertedAvailableSize,
        },
        {
            label: i18n('usage'),
            value: usage + '%',
        },
    ];

    return (
        <InfoViewer dots={true} info={info} className={b('groups-stats-popup-content')} size="s" />
    );
};

interface DiskGroupsStatsProps {
    stats: DiskGroupsStats;
}

const DiskGroupsStatsBars = ({stats}: DiskGroupsStatsProps) => {
    return (
        <div className={b('storage-groups-stats')}>
            {Object.values(stats).map((erasureStats) => (
                <ContentWithPopup
                    placement={['right']}
                    key={erasureStats.erasure}
                    content={<GroupsStatsPopupContent stats={erasureStats} />}
                >
                    <ProgressViewer
                        className={b('groups-stats-bar')}
                        value={erasureStats.createdGroups}
                        capacity={erasureStats.totalGroups}
                    />
                </ContentWithPopup>
            ))}
        </div>
    );
};

const getGroupsStatsFields = (groupsStats: ClusterGroupsStats) => {
    return Object.keys(groupsStats).map((diskType) => {
        return {
            label: i18n('storage-groups', {diskType}),
            value: <DiskGroupsStatsBars stats={groupsStats[diskType]} />,
        };
    });
};

const getInfo = (
    cluster: TClusterInfo,
    versionsValues: VersionValue[],
    groupsStats: ClusterGroupsStats,
    additionalInfo: InfoViewerItem[],
    links: ClusterLink[],
) => {
    const info: InfoViewerItem[] = [];

    if (cluster.DataCenters) {
        info.push({
            label: i18n('dc'),
            value: <Tags tags={cluster.DataCenters} />,
        });
    }

    if (cluster.SystemTablets) {
        const tablets = cluster.SystemTablets.slice(0).sort(compareTablets);
        info.push({
            label: i18n('tablets'),
            value: (
                <div className={b('system-tablets')}>
                    {tablets.map((tablet, tabletIndex) => (
                        <Tablet key={tabletIndex} tablet={tablet} />
                    ))}
                </div>
            ),
        });
    }

    if (cluster.Tenants) {
        info.push({
            label: i18n('databases'),
            value: cluster.Tenants,
        });
    }

    info.push(
        {
            label: i18n('nodes'),
            value: <ProgressViewer value={cluster?.NodesAlive} capacity={cluster?.NodesTotal} />,
        },
        {
            label: i18n('load'),
            value: <ProgressViewer value={cluster?.LoadAverage} capacity={cluster?.NumberOfCpus} />,
        },
        {
            label: i18n('storage-size'),
            value: (
                <ProgressViewer
                    value={cluster?.StorageUsed}
                    capacity={cluster?.StorageTotal}
                    formatValues={formatStorageValues}
                />
            ),
        },
    );

    if (Object.keys(groupsStats).length) {
        info.push(...getGroupsStatsFields(groupsStats));
    }

    info.push(
        ...additionalInfo,
        {
            label: i18n('links'),
            value: (
                <div className={b('links')}>
                    {links.map(({title, url}) => (
                        <LinkWithIcon key={title} title={title} url={url} />
                    ))}
                </div>
            ),
        },
        {
            label: i18n('versions'),
            value: <VersionsBar versionsValues={versionsValues} />,
        },
    );

    return info;
};

interface ClusterInfoProps {
    cluster?: TClusterInfo;
    versionsValues?: VersionValue[];
    groupsStats?: ClusterGroupsStats;
    loading?: boolean;
    error?: IResponseError;
    additionalClusterProps?: AdditionalClusterProps;
}

export const ClusterInfo = ({
    cluster,
    versionsValues = [],
    groupsStats = {},
    loading,
    error,
    additionalClusterProps = {},
}: ClusterInfoProps) => {
    const singleClusterMode = useTypedSelector((state) => state.singleClusterMode);

    let internalLink = backend + '/internal';

    if (singleClusterMode && !customBackend) {
        internalLink = `/internal`;
    }

    const {info = [], links = []} = additionalClusterProps;

    const clusterInfo = getInfo(cluster ?? {}, versionsValues, groupsStats, info, [
        {title: DEVELOPER_UI_TITLE, url: internalLink},
        ...links,
    ]);

    const getContent = () => {
        if (loading) {
            return <InfoViewerSkeleton className={b('skeleton')} rows={9} />;
        }

        if (error && !cluster) {
            return null;
        }

        return <InfoViewer dots={true} info={clusterInfo} />;
    };

    return (
        <div className={b()}>
            {error ? <ResponseError error={error} className={b('error')} /> : null}
            <div className={b('info')}>{getContent()}</div>
        </div>
    );
};
