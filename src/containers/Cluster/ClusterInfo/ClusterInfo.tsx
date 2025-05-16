import React from 'react';

import {DefinitionList, Flex, Text} from '@gravity-ui/uikit';

import {ResponseError} from '../../../components/Errors/ResponseError';
import {InfoViewerSkeleton} from '../../../components/InfoViewerSkeleton/InfoViewerSkeleton';
import {LinkWithIcon} from '../../../components/LinkWithIcon/LinkWithIcon';
import type {ClusterGroupsStats} from '../../../store/reducers/cluster/types';
import type {AdditionalClusterProps} from '../../../types/additionalProps';
import type {TClusterInfo} from '../../../types/api/cluster';
import type {IResponseError} from '../../../types/api/error';
import {formatNumber} from '../../../utils/dataFormatters/dataFormatters';
import i18n from '../i18n';
import {getTotalStorageGroupsUsed} from '../utils';

import {b} from './shared';
import {useClusterLinks} from './utils/useClusterLinks';
import {getInfo, getStorageGroupStats} from './utils/utils';

import './ClusterInfo.scss';

interface ClusterInfoProps {
    cluster?: TClusterInfo;
    loading?: boolean;
    error?: IResponseError | string;
    additionalClusterProps?: AdditionalClusterProps;
    groupStats?: ClusterGroupsStats;
}

export const ClusterInfo = ({
    cluster,
    loading,
    error,
    additionalClusterProps = {},
    groupStats = {},
}: ClusterInfoProps) => {
    const {info = [], links = []} = additionalClusterProps;

    const clusterLinks = useClusterLinks();
    const linksList = links.concat(clusterLinks);

    const clusterInfo = getInfo(cluster ?? {}, info);

    const renderDetails = () => {
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
                        <Flex direction="column" gap={2}>
                            {linksList.map(({title, url}) => {
                                return <LinkWithIcon key={title} title={title} url={url} />;
                            })}
                        </Flex>
                    </DefinitionList.Item>
                )}
            </DefinitionList>
        );
    };

    const renderDetailsContent = () => {
        if (loading) {
            return <InfoViewerSkeleton className={b('skeleton')} rows={4} />;
        }

        return renderDetails();
    };

    const renderDetailSection = () => {
        return (
            <InfoSection>
                <Text as="div" variant="subheader-2" className={b('section-title')}>
                    {i18n('title_details')}
                </Text>
                {renderDetailsContent()}
            </InfoSection>
        );
    };

    const total = getTotalStorageGroupsUsed(groupStats);

    const renderGroupsInfoSection = () => {
        const stats = getStorageGroupStats(groupStats);
        if (loading) {
            return null;
        }
        return (
            <InfoSection>
                <Text as="div" variant="subheader-2" className={b('section-title')}>
                    {i18n('title_storage-groups')}{' '}
                    <Text variant="subheader-2" color="secondary">
                        {formatNumber(total)}
                    </Text>
                </Text>
                <Flex gap={2}>{stats}</Flex>
            </InfoSection>
        );
    };

    return (
        <Flex gap={4} direction="column" className={b()}>
            {error ? <ResponseError error={error} className={b('error')} /> : null}
            {renderDetailSection()}
            {renderGroupsInfoSection()}
        </Flex>
    );
};

interface InfoSectionProps {
    children: React.ReactNode;
}

function InfoSection({children}: InfoSectionProps) {
    return (
        <Flex direction="column" gap={3}>
            {children}
        </Flex>
    );
}
