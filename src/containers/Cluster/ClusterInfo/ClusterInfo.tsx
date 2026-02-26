import React from 'react';

import {Card, DefinitionList, Flex, Text} from '@gravity-ui/uikit';

import {ResponseError} from '../../../components/Errors/ResponseError';
import {LinkWithIcon} from '../../../components/LinkWithIcon/LinkWithIcon';
import {Skeleton} from '../../../components/Skeleton/Skeleton';
import type {ClusterGroupsStats} from '../../../store/reducers/cluster/types';
import type {AdditionalClusterProps} from '../../../types/additionalProps';
import type {TBridgePile, TClusterInfo} from '../../../types/api/cluster';
import type {IResponseError} from '../../../types/api/error';
import {formatNumber} from '../../../utils/dataFormatters/dataFormatters';
import {BridgeInfoTable} from '../ClusterOverview/components/BridgeInfoTable';
import i18n from '../i18n';

import {StorageGroupStats} from './components/DiskGroupsStatsBars/DiskGroupsStats';
import {b} from './shared';
import {useClusterLinks} from './utils/useClusterLinks';

import './ClusterInfo.scss';

interface ClusterInfoProps {
    cluster?: TClusterInfo;
    loading?: boolean;
    error?: IResponseError | string;
    additionalClusterProps?: AdditionalClusterProps;
    groupStats?: ClusterGroupsStats;
    bridgePiles?: TBridgePile[];
}

export const ClusterInfo = ({
    cluster,
    loading,
    error,
    additionalClusterProps = {},
    groupStats = {},
    bridgePiles,
}: ClusterInfoProps) => {
    const {info = [], links = []} = additionalClusterProps;

    const clusterLinks = useClusterLinks();
    const linksList = links.concat(clusterLinks);

    const noDetails = (error && !cluster) || (!info.length && !linksList.length);

    const renderDetailSection = () => {
        if (loading) {
            return (
                <InfoSection className={b('detail-section')}>
                    <Skeleton className={b('skeleton-title')} />
                    <Skeleton className={b('skeleton-section')} />
                </InfoSection>
            );
        }

        if (noDetails) {
            return null;
        }

        return (
            <InfoSection className={b('detail-section')}>
                <Text as="div" variant="subheader-2" className={b('section-title')}>
                    {i18n('title_details')}
                </Text>
                <Card view="outlined" className={b('section')}>
                    <DefinitionList nameMaxWidth={200} className={b('details')}>
                        {info.map(({label, value}) => {
                            return (
                                <DefinitionList.Item key={label} name={label}>
                                    <div className={b('details-value')}>{value}</div>
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
                </Card>
            </InfoSection>
        );
    };

    const renderStorageGroupsSection = () => {
        if (loading || Object.keys(groupStats).length === 0) {
            return null;
        }
        return (
            <InfoSection className={b('storage-section')}>
                <Text as="div" variant="subheader-2" className={b('section-title')}>
                    {i18n('title_storage-groups')}
                </Text>
                <Card view="filled" className={b('section', {compact: true, filled: true})}>
                    <StorageGroupStats groupStats={groupStats} />
                </Card>
            </InfoSection>
        );
    };

    const renderBridgePilesSection = () => {
        if (loading || !bridgePiles?.length) {
            return null;
        }
        return (
            <InfoSection className={b('bridge-section')}>
                <Text as="div" variant="subheader-2" className={b('section-title')}>
                    {i18n('title_bridge')}{' '}
                    <Text variant="subheader-2" color="secondary">
                        {formatNumber(bridgePiles.length)}
                    </Text>
                </Text>
                <BridgeInfoTable piles={bridgePiles} />
            </InfoSection>
        );
    };

    return (
        <Flex gap={4} direction="column" className={b()}>
            {error ? <ResponseError error={error} className={b('error')} /> : null}
            <div className={b('sections', {'no-details': noDetails})}>
                {renderDetailSection()}
                {renderStorageGroupsSection()}
                {renderBridgePilesSection()}
            </div>
        </Flex>
    );
};

interface InfoSectionProps {
    children: React.ReactNode;
    className?: string;
}

function InfoSection({children, className}: InfoSectionProps) {
    return (
        <Flex direction="column" gap={2} className={className}>
            {children}
        </Flex>
    );
}
