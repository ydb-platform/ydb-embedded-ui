import {DefinitionList, Flex} from '@gravity-ui/uikit';

import {ResponseError} from '../../../components/Errors/ResponseError';
import {InfoViewerSkeleton} from '../../../components/InfoViewerSkeleton/InfoViewerSkeleton';
import {LinkWithIcon} from '../../../components/LinkWithIcon/LinkWithIcon';
import type {AdditionalClusterProps} from '../../../types/additionalProps';
import type {TClusterInfo} from '../../../types/api/cluster';
import type {IResponseError} from '../../../types/api/error';
import i18n from '../i18n';

import {b} from './shared';
import {useClusterLinks} from './utils/useClusterLinks';
import {getInfo} from './utils/utils';

import './ClusterInfo.scss';

interface ClusterInfoProps {
    cluster?: TClusterInfo;
    loading?: boolean;
    error?: IResponseError | string;
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
    const linksList = links.concat(clusterLinks);

    const clusterInfo = getInfo(cluster ?? {}, info);

    const renderInfo = () => {
        if (error && !cluster) {
            return null;
        }

        return (
            <DefinitionList nameMaxWidth={200}>
                {clusterInfo.map(({label, value}) => {
                    return (
                        <DefinitionList.Item key={label} name={label}>
                            {value}
                        </DefinitionList.Item>
                    );
                })}
                {linksList.length > 0 && (
                    <DefinitionList.Item name={i18n('title_links')}>
                        <Flex direction="column" gap={1}>
                            {linksList.map(({title, url}) => {
                                return <LinkWithIcon key={title} title={title} url={url} />;
                            })}
                        </Flex>
                    </DefinitionList.Item>
                )}
            </DefinitionList>
        );
    };

    const renderContent = () => {
        if (loading) {
            return <InfoViewerSkeleton className={b('skeleton')} rows={4} />;
        }

        return renderInfo();
    };

    return (
        <div className={b()}>
            {error ? <ResponseError error={error} className={b('error')} /> : null}
            {renderContent()}
        </div>
    );
};
