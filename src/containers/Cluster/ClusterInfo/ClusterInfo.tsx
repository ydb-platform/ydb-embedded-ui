import {ResponseError} from '../../../components/Errors/ResponseError';
import {InfoViewer} from '../../../components/InfoViewer/InfoViewer';
import {InfoViewerSkeleton} from '../../../components/InfoViewerSkeleton/InfoViewerSkeleton';
import {backend, customBackend} from '../../../store';
import type {ClusterGroupsStats} from '../../../store/reducers/cluster/types';
import type {AdditionalClusterProps} from '../../../types/additionalProps';
import type {TClusterInfo} from '../../../types/api/cluster';
import type {IResponseError} from '../../../types/api/error';
import type {VersionToColorMap} from '../../../types/versions';
import {DEVELOPER_UI_TITLE} from '../../../utils/constants';
import {useTypedSelector} from '../../../utils/hooks';

import {b} from './shared';
import {getInfo, useGetVersionValues} from './utils';

import './ClusterInfo.scss';

interface ClusterInfoProps {
    cluster?: TClusterInfo;
    versionToColor?: VersionToColorMap;
    groupsStats?: ClusterGroupsStats;
    loading?: boolean;
    error?: IResponseError;
    additionalClusterProps?: AdditionalClusterProps;
}

export const ClusterInfo = ({
    cluster,
    versionToColor,
    groupsStats = {},
    loading,
    error,
    additionalClusterProps = {},
}: ClusterInfoProps) => {
    const singleClusterMode = useTypedSelector((state) => state.singleClusterMode);

    const versionsValues = useGetVersionValues(cluster, versionToColor);

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
