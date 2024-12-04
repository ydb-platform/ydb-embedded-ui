import {ResponseError} from '../../../components/Errors/ResponseError';
import {InfoViewer} from '../../../components/InfoViewer/InfoViewer';
import {InfoViewerSkeleton} from '../../../components/InfoViewerSkeleton/InfoViewerSkeleton';
import type {AdditionalClusterProps} from '../../../types/additionalProps';
import type {TClusterInfo} from '../../../types/api/cluster';
import type {IResponseError} from '../../../types/api/error';
import type {VersionToColorMap} from '../../../types/versions';

import {b} from './shared';
import {getInfo, useClusterLinks} from './utils';

import './ClusterInfo.scss';

interface ClusterInfoProps {
    cluster?: TClusterInfo;
    versionToColor?: VersionToColorMap;
    loading?: boolean;
    error?: IResponseError;
    additionalClusterProps?: AdditionalClusterProps;
}

export const ClusterInfo = ({
    cluster,
    loading,
    error,
    additionalClusterProps = {},
}: ClusterInfoProps) => {
    const {info = [], links = []} = additionalClusterProps;

    const clusterLinks = useClusterLinks();

    const clusterInfo = getInfo(cluster ?? {}, info, [...links, ...clusterLinks]);

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
