import block from 'bem-cn-lite';

import {Skeleton} from '@gravity-ui/uikit';

import EntityStatus from '../../../components/EntityStatus/EntityStatus';
import ProgressViewer from '../../../components/ProgressViewer/ProgressViewer';
import InfoViewer, {InfoViewerItem} from '../../../components/InfoViewer/InfoViewer';
import {Tags} from '../../../components/Tags';
import {Tablet} from '../../../components/Tablet';
import {ResponseError} from '../../../components/Errors/ResponseError';
import {ExternalLinkWithIcon} from '../../../components/ExternalLinkWithIcon/ExternalLinkWithIcon';
import {IconWrapper as Icon} from '../../../components/Icon/Icon';

import type {IResponseError} from '../../../types/api/error';
import type {AdditionalClusterProps, ClusterLink} from '../../../types/additionalProps';
import type {VersionValue} from '../../../types/versions';
import type {TClusterInfo} from '../../../types/api/cluster';
import {backend, customBackend} from '../../../store';
import {formatStorageValues} from '../../../utils';
import {useSetting, useTypedSelector} from '../../../utils/hooks';
import {CLUSTER_INFO_HIDDEN_KEY} from '../../../utils/constants';

import {VersionsBar} from '../VersionsBar/VersionsBar';
import {ClusterInfoSkeleton} from '../ClusterInfoSkeleton/ClusterInfoSkeleton';

import {compareTablets} from './utils';

import './ClusterInfo.scss';

const b = block('cluster-info');

const getInfo = (
    cluster: TClusterInfo,
    versionsValues: VersionValue[],
    additionalInfo: InfoViewerItem[],
    links: ClusterLink[],
) => {
    const info: InfoViewerItem[] = [];

    if (cluster.DataCenters) {
        info.push({
            label: 'DC',
            value: <Tags tags={cluster.DataCenters} />,
        });
    }

    if (cluster.SystemTablets) {
        info.push({
            label: 'Tablets',
            value: (
                <div className={b('system-tablets')}>
                    {cluster.SystemTablets.sort(compareTablets).map((tablet, tabletIndex) => (
                        <Tablet key={tabletIndex} tablet={tablet} />
                    ))}
                </div>
            ),
        });
    }

    info.push(
        {
            label: 'Nodes',
            value: (
                <ProgressViewer
                    className={b('metric-field')}
                    value={cluster?.NodesAlive}
                    capacity={cluster?.NodesTotal}
                />
            ),
        },
        {
            label: 'Load',
            value: (
                <ProgressViewer
                    className={b('metric-field')}
                    value={cluster?.LoadAverage}
                    capacity={cluster?.NumberOfCpus}
                />
            ),
        },
        {
            label: 'Storage',
            value: (
                <ProgressViewer
                    className={b('metric-field')}
                    value={cluster?.StorageUsed}
                    capacity={cluster?.StorageTotal}
                    formatValues={formatStorageValues}
                />
            ),
        },
        ...additionalInfo,
        {
            label: 'Links',
            value: (
                <div className={b('links')}>
                    {links.map(({title, url}) => (
                        <ExternalLinkWithIcon key={title} title={title} url={url} />
                    ))}
                </div>
            ),
        },
        {
            label: 'Versions',
            value: <VersionsBar versionsValues={versionsValues} />,
        },
    );

    return info;
};

interface ClusterInfoProps {
    cluster?: TClusterInfo;
    versionsValues?: VersionValue[];
    loading?: boolean;
    error?: IResponseError;
    additionalClusterProps?: AdditionalClusterProps;
}

export const ClusterInfo = ({
    cluster = {},
    versionsValues = [],
    loading,
    error,
    additionalClusterProps = {},
}: ClusterInfoProps) => {
    const singleClusterMode = useTypedSelector((state) => state.singleClusterMode);

    const [clusterInfoHidden, setClusterInfoHidden] = useSetting(CLUSTER_INFO_HIDDEN_KEY, false);

    const togleClusterInfoVisibility = () => {
        setClusterInfoHidden(!clusterInfoHidden);
    };

    let internalLink = backend + '/internal';

    if (singleClusterMode && !customBackend) {
        internalLink = `/internal`;
    }

    const {info = [], links = []} = additionalClusterProps;

    const clusterInfo = getInfo(cluster, versionsValues, info, [
        {title: 'Developer UI', url: internalLink},
        ...links,
    ]);

    const getContent = () => {
        if (loading) {
            return <ClusterInfoSkeleton />;
        }

        if (error) {
            <ResponseError error={error} className={b('error')} />;
        }

        return <InfoViewer dots={true} info={clusterInfo} />;
    };

    const getClusterTitle = () => {
        if (loading) {
            return <Skeleton className={b('title-skeleton')} />;
        }

        return (
            <EntityStatus
                size="m"
                status={cluster?.Overall}
                name={cluster?.Name ?? 'Unknown cluster'}
                className={b('title')}
            />
        );
    };

    return (
        <div className={b()}>
            <div className={b('header')} onClick={togleClusterInfoVisibility}>
                {getClusterTitle()}
                <Icon
                    name="chevron-down"
                    width={24}
                    height={24}
                    className={b('header__expand-button', {rotate: clusterInfoHidden})}
                />
            </div>
            <div className={b('info', {hidden: clusterInfoHidden})}>{getContent()}</div>
        </div>
    );
};
