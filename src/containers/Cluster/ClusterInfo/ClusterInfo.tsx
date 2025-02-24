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
    const linksList = links.concat(clusterLinks);

    const clusterInfo = getInfo(cluster ?? {}, info);

    const renderInfo = () => {
        if (error && !cluster) {
            return null;
        }

        return (
            <div>
                <div className={b('section-title')}>{i18n('title_info')}</div>
                <DefinitionList nameMaxWidth={200}>
                    {clusterInfo.map(({label, value}) => {
                        return (
                            <DefinitionList.Item key={label} name={label}>
                                {value}
                            </DefinitionList.Item>
                        );
                    })}
                </DefinitionList>
            </div>
        );
    };

    const renderLinks = () => {
        if (linksList.length) {
            return (
                <div>
                    <div className={b('section-title')}>{i18n('title_links')}</div>
                    <Flex direction="column" gap={4}>
                        {linksList.map(({title, url}) => {
                            return <LinkWithIcon key={title} title={title} url={url} />;
                        })}
                    </Flex>
                </div>
            );
        }

        return null;
    };

    const renderContent = () => {
        if (loading) {
            return <InfoViewerSkeleton className={b('skeleton')} rows={4} />;
        }

        return (
            <Flex gap={10} wrap="nowrap">
                {renderInfo()}
                {renderLinks()}
            </Flex>
        );
    };

    return (
        <div className={b()}>
            {error ? <ResponseError error={error} className={b('error')} /> : null}
            {renderContent()}
        </div>
    );
};
