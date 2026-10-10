import React from 'react';

import {ArrowLeft, Wrench} from '@gravity-ui/icons';
import {Button, Flex, Icon, Tab, TabList, TabProvider, Text} from '@gravity-ui/uikit';
import {skipToken} from '@reduxjs/toolkit/query';
import {isNil} from 'lodash';
import {Helmet} from 'react-helmet-async';
import {useHistory} from 'react-router-dom';

import {AutoRefreshControl} from '../../components/AutoRefreshControl/AutoRefreshControl';
import {DiskTypeLabel} from '../../components/DiskStatus/DiskStatus';
import {ResponseError} from '../../components/Errors/ResponseError';
import {
    EvictVDiskButton,
    isAllVdiskParamsDefined,
} from '../../components/EvictVDiskButton/EvictVDiskButton';
import {InfoViewerSkeleton} from '../../components/InfoViewerSkeleton/InfoViewerSkeleton';
import {InternalLink} from '../../components/InternalLink/InternalLink';
import {LinkWithIcon} from '../../components/LinkWithIcon/LinkWithIcon';
import {VDiskCopyableValue} from '../../components/VDiskInfo/VDiskCopyableValue';
import {VDiskInfo} from '../../components/VDiskInfo/VDiskInfo';
import {vDiskInfoKeyset} from '../../components/VDiskInfo/i18n';
import {
    VDiskDonorLabel,
    VDiskReplicationStatus,
    VDiskStateLabel,
} from '../../components/VDiskStatus';
import {useVDiskPagePath} from '../../routes';
import {api} from '../../store/reducers/api';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {vDiskApi} from '../../store/reducers/vdisk/vdisk';
import {cn} from '../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {parseVdiskId} from '../../utils/dataFormatters/dataFormatters';
import {createVDiskDeveloperUILink, useHasDeveloperUi} from '../../utils/developerUI/developerUI';
import {useAutoRefreshInterval, useTypedDispatch} from '../../utils/hooks';
import {useAppTitle} from '../App/AppTitleContext';
import {PaginatedStorage} from '../Storage/PaginatedStorage';

import {VDiskStorageDetails} from './VDiskStorageDetails';
import {VDiskTablets} from './VDiskTablets';
import {vDiskPageKeyset} from './i18n';
import {useVDiskQueryParams} from './useVDiskQueryParams';

import './VDiskPage.scss';

const vDiskPageCn = cn('ydb-vdisk-page');

export function VDiskPage() {
    const dispatch = useTypedDispatch();
    const history = useHistory();
    const showBackButton = history.length > 1;
    const getVDiskPagePath = useVDiskPagePath();

    const containerRef = React.useRef<HTMLDivElement>(null);

    const {nodeId, vDiskId: vDiskIdParam, database, vDiskTab, vDiskTabs} = useVDiskQueryParams();
    const hasDeveloperUi = useHasDeveloperUi();

    const [autoRefreshInterval] = useAutoRefreshInterval();

    const params = React.useMemo(() => {
        if (!isNil(vDiskIdParam)) {
            return {vDiskId: vDiskIdParam, nodeId: nodeId?.toString(), database};
        }

        return skipToken;
    }, [nodeId, vDiskIdParam, database]);
    const {
        currentData: vDiskData,
        isFetching,
        error,
    } = vDiskApi.useGetVDiskDataQuery(params, {
        pollingInterval: autoRefreshInterval,
    });

    const vDiskSlotId = vDiskData?.VDiskSlotId;

    React.useEffect(() => {
        dispatch(
            setHeaderBreadcrumbs('vDisk', {
                groupId: vDiskData?.VDiskId?.GroupID,
                database,
                vDiskId: vDiskData?.StringifiedId,
            }),
        );
    }, [dispatch, database, vDiskData?.VDiskId?.GroupID, vDiskData?.StringifiedId]);

    const loading = isFetching && vDiskData === undefined;
    const {NodeHost, NodeId, PDiskId, PDiskType, VDiskId, StringifiedId} = vDiskData || {};

    const resolvedVDiskId = VDiskId || (!loading && parseVdiskId(vDiskIdParam)) || undefined;
    const {GroupID} = resolvedVDiskId || {};

    const vDiskId = vDiskData?.StringifiedId || (loading ? undefined : vDiskIdParam);
    const {appTitle} = useAppTitle();

    const renderHelmet = () => {
        const vDiskPagePart = vDiskSlotId
            ? `${vDiskPageKeyset('vdisk')} ${vDiskSlotId}`
            : vDiskPageKeyset('vdisk');

        const pDiskPagePart = PDiskId
            ? `${vDiskPageKeyset('pdisk')} ${PDiskId}`
            : vDiskPageKeyset('pdisk');

        const nodePagePart = NodeHost ? NodeHost : vDiskPageKeyset('node');

        return (
            <Helmet
                titleTemplate={`%s - ${vDiskPagePart} - ${pDiskPagePart} — ${nodePagePart} — ${appTitle}`}
                defaultTitle={`${vDiskPagePart} - ${pDiskPagePart} — ${nodePagePart} — ${appTitle}`}
            />
        );
    };

    const renderPageMeta = () => {
        if (!showBackButton) {
            return null;
        }

        return (
            <Flex
                className={vDiskPageCn('meta')}
                alignItems="center"
                justifyContent="space-between"
                gap={1}
            >
                <Button size="m" view="outlined" onClick={() => history.goBack()}>
                    <Icon data={ArrowLeft} size={16} />
                    {vDiskPageKeyset('action_back')}
                </Button>
                <AutoRefreshControl className={vDiskPageCn('refresh-control')} />
            </Flex>
        );
    };

    const renderTitleMeta = () => {
        return (
            <Flex gap={2} wrap="wrap" alignItems="center">
                <VDiskStateLabel state={vDiskData?.VDiskState} size="s" />
                {vDiskData?.DonorMode ? (
                    <VDiskDonorLabel donorMode size="s" />
                ) : (
                    <VDiskReplicationStatus data={vDiskData || {}} size="s" />
                )}
                <DiskTypeLabel type={PDiskType} size="s" />
            </Flex>
        );
    };

    const renderPageTitle = () => {
        return (
            <Flex
                className={vDiskPageCn('title')}
                alignItems="flex-start"
                gap={2}
                wrap="nowrap"
                qa="vdisk-header"
            >
                <Flex direction="column" gap={1} className={vDiskPageCn('title-content')}>
                    <Flex gap={3} alignItems="center" wrap="wrap">
                        <VDiskCopyableValue copyText={vDiskId} fieldName={vDiskPageKeyset('vdisk')}>
                            <Text as="h1" variant="header-1" className={vDiskPageCn('heading')}>
                                {vDiskPageKeyset('vdisk')}{' '}
                                <Text color="hint" variant="header-1">
                                    {vDiskId || EMPTY_DATA_PLACEHOLDER}
                                </Text>
                            </Text>
                        </VDiskCopyableValue>
                        {renderTitleMeta()}
                    </Flex>
                    <Flex gap={1} alignItems="center" className={vDiskPageCn('pool')}>
                        <Text color="secondary">{vDiskInfoKeyset('pool-name')}:</Text>
                        <VDiskCopyableValue
                            copyText={vDiskData?.StoragePoolName}
                            fieldName={vDiskInfoKeyset('pool-name')}
                        >
                            <Text color="secondary" className={vDiskPageCn('pool-name')}>
                                {vDiskData?.StoragePoolName || EMPTY_DATA_PLACEHOLDER}
                            </Text>
                        </VDiskCopyableValue>
                    </Flex>
                </Flex>
                {!showBackButton && (
                    <AutoRefreshControl className={vDiskPageCn('refresh-control')} />
                )}
            </Flex>
        );
    };

    const handleAfterEvictVDisk = React.useCallback(() => {
        dispatch(
            api.util.invalidateTags([
                {
                    type: 'VDiskData',
                    id: vDiskId?.toString(),
                },
                'StorageData',
            ]),
        );
    }, [dispatch, vDiskId]);

    const renderControls = () => {
        const canEvict = isAllVdiskParamsDefined(resolvedVDiskId) && !vDiskData?.DonorMode;
        const developerUILink =
            hasDeveloperUi && !isNil(NodeId) && !isNil(PDiskId) && !isNil(vDiskSlotId)
                ? createVDiskDeveloperUILink({
                      nodeId: NodeId,
                      pDiskId: PDiskId,
                      vDiskSlotId,
                  })
                : undefined;
        if (!canEvict && !developerUILink) {
            return null;
        }
        return (
            <div className={vDiskPageCn('controls')} data-qa="vdisk-controls">
                {canEvict && isAllVdiskParamsDefined(resolvedVDiskId) && (
                    <EvictVDiskButton
                        vDiskId={resolvedVDiskId}
                        view="action"
                        onSuccess={handleAfterEvictVDisk}
                    />
                )}
                {developerUILink && (
                    <LinkWithIcon
                        title={vDiskPageKeyset('action_open-in-developer-ui')}
                        url={developerUILink}
                        icon={Wrench}
                        hideEndIcon
                    />
                )}
            </div>
        );
    };

    const renderInfo = () => {
        return <VDiskInfo key={vDiskId} data={vDiskData} className={vDiskPageCn('info')} />;
    };

    const renderStorageDetails = () => {
        return <VDiskStorageDetails data={vDiskData} className={vDiskPageCn('storage-details')} />;
    };

    const renderTabs = () => {
        return (
            <div className={vDiskPageCn('tabs')}>
                <TabProvider value={vDiskTab}>
                    <TabList size="l">
                        {vDiskTabs.map(({id, title}) => {
                            const path = getVDiskPagePath(
                                {
                                    nodeId: nodeId?.toString(),
                                    vDiskId: vDiskId?.toString(),
                                },
                                {activeTab: id},
                            );

                            return (
                                <Tab key={id} value={id} disabled={!path}>
                                    <InternalLink as="tab" to={path}>
                                        {title}
                                    </InternalLink>
                                </Tab>
                            );
                        })}
                    </TabList>
                </TabProvider>
            </div>
        );
    };

    const renderStorageInfo = () => {
        if (!isNil(GroupID)) {
            return (
                <PaginatedStorage
                    database={database}
                    groupId={GroupID}
                    nodeId={nodeId ?? undefined}
                    pDiskId={PDiskId}
                    scrollContainerRef={containerRef}
                    viewContext={{
                        groupId: GroupID?.toString(),
                        nodeId: nodeId?.toString(),
                        pDiskId: PDiskId?.toString(),
                        vDiskSlotId: vDiskSlotId?.toString(),
                    }}
                />
            );
        }

        return null;
    };

    const renderTabsContent = () => {
        switch (vDiskTab) {
            case 'storage': {
                return renderStorageInfo();
            }
            case 'tablets': {
                return (
                    <VDiskTablets
                        scrollContainerRef={containerRef}
                        nodeId={nodeId ?? undefined}
                        pDiskId={PDiskId}
                        vDiskSlotId={vDiskSlotId ?? undefined}
                        vDiskId={StringifiedId}
                        className={vDiskPageCn('tablets-content')}
                    />
                );
            }
            default:
                return null;
        }
    };

    const renderContent = () => {
        if (loading) {
            return <InfoViewerSkeleton rows={9} />;
        }

        return (
            <React.Fragment>
                {error ? <ResponseError error={error} /> : null}
                {renderStorageDetails()}
                {renderInfo()}
                {renderTabs()}
                {renderTabsContent()}
            </React.Fragment>
        );
    };

    return (
        <div className={vDiskPageCn(null)} ref={containerRef}>
            {renderHelmet()}
            {renderPageMeta()}
            {renderPageTitle()}
            {renderControls()}
            {renderContent()}
        </div>
    );
}
