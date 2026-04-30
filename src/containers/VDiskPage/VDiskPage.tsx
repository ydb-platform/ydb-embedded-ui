import React from 'react';

import {Flex, Icon, Label, Tab, TabList, TabProvider} from '@gravity-ui/uikit';
import {skipToken} from '@reduxjs/toolkit/query';
import {isNil} from 'lodash';
import {Helmet} from 'react-helmet-async';
import {StringParam, useQueryParams} from 'use-query-params';
import {z} from 'zod';

import {EntityPageTitle} from '../../components/EntityPageTitle/EntityPageTitle';
import {ResponseError} from '../../components/Errors/ResponseError';
import {
    EvictVDiskButton,
    isAllVdiskParamsDefined,
} from '../../components/EvictVDiskButton/EvictVDiskButton';
import {InfoViewerSkeleton} from '../../components/InfoViewerSkeleton/InfoViewerSkeleton';
import {InternalLink} from '../../components/InternalLink/InternalLink';
import {PageMetaWithAutorefresh} from '../../components/PageMeta/PageMeta';
import {VDiskInfo} from '../../components/VDiskInfo/VDiskInfo';
import {useVDiskPagePath} from '../../routes';
import {api} from '../../store/reducers/api';
import {useNewStorageViewEnabled} from '../../store/reducers/capabilities/hooks';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {vDiskApi} from '../../store/reducers/vdisk/vdisk';
import {cn} from '../../utils/cn';
import {parseVdiskId} from '../../utils/dataFormatters/dataFormatters';
import {VDISK_LABEL_CONFIG} from '../../utils/disks/constants';
import {getSeverityColor} from '../../utils/disks/helpers';
import {useAutoRefreshInterval, useTypedDispatch} from '../../utils/hooks';
import {useAppTitle} from '../App/AppTitleContext';
import {PaginatedStorage} from '../Storage/PaginatedStorage';

import {VDiskStorageDetails} from './VDiskStorageDetails';
import {VDiskTablets} from './VDiskTablets';
import {vDiskPageKeyset} from './i18n';

import './VDiskPage.scss';

const vDiskPageCn = cn('ydb-vdisk-page');

const VDISK_TABS_IDS = {
    storage: 'storage',
    tablets: 'tablets',
} as const;

const VDISK_PAGE_TABS = [
    {
        id: VDISK_TABS_IDS.storage,
        get title() {
            return vDiskPageKeyset('storage');
        },
    },
    {
        id: VDISK_TABS_IDS.tablets,
        get title() {
            return vDiskPageKeyset('tablets');
        },
    },
];

const vDiskTabSchema = z.nativeEnum(VDISK_TABS_IDS).catch(VDISK_TABS_IDS.storage);

export function VDiskPage() {
    const dispatch = useTypedDispatch();
    const getVDiskPagePath = useVDiskPagePath();

    const containerRef = React.useRef<HTMLDivElement>(null);

    const [{nodeId, vDiskId: vDiskIdParam, activeTab, database: databaseParam}] = useQueryParams({
        nodeId: StringParam,
        vDiskId: StringParam,
        activeTab: StringParam,
        database: StringParam,
    });
    const database = databaseParam ?? undefined;

    const vDiskTab = vDiskTabSchema.parse(activeTab);
    const newStorageViewEnabled = useNewStorageViewEnabled();

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
    const {
        NodeHost,
        NodeId,
        NodeType,
        NodeDC,
        PDiskId,
        PDiskType,
        Severity,
        VDiskId,
        StringifiedId,
    } = vDiskData || {};

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
        const hostItem = NodeHost ? `${vDiskPageKeyset('fqdn')}: ${NodeHost}` : undefined;
        const nodeIdItem = NodeId ? `${vDiskPageKeyset('node')}: ${NodeId}` : undefined;
        const pDiskIdItem = NodeId ? `${vDiskPageKeyset('pdisk')}: ${PDiskId}` : undefined;

        return (
            <PageMetaWithAutorefresh
                className={vDiskPageCn('meta')}
                loading={loading}
                items={[hostItem, nodeIdItem, NodeType, NodeDC, pDiskIdItem, PDiskType]}
            />
        );
    };

    const renderTitleMeta = () => {
        if (!vDiskData?.DonorMode) {
            return null;
        }
        const donorLabelConfig = VDISK_LABEL_CONFIG.donor;
        return (
            <Label
                theme={donorLabelConfig.theme}
                icon={donorLabelConfig.icon ? <Icon data={donorLabelConfig.icon} /> : undefined}
                size="m"
            >
                {vDiskPageKeyset('label_donor')}
            </Label>
        );
    };

    const renderPageTitle = () => {
        return (
            <Flex gap={2} alignItems="center">
                <EntityPageTitle
                    className={vDiskPageCn('title')}
                    entityName={vDiskPageKeyset('vdisk')}
                    status={getSeverityColor(Severity)}
                    id={vDiskId}
                    metaInfo={renderTitleMeta()}
                />
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
        if (!isAllVdiskParamsDefined(resolvedVDiskId)) {
            return null;
        }
        return (
            <div className={vDiskPageCn('controls')}>
                <EvictVDiskButton
                    vDiskId={resolvedVDiskId}
                    donorMode={vDiskData?.DonorMode}
                    onSuccess={handleAfterEvictVDisk}
                />
            </div>
        );
    };

    const renderInfo = () => {
        return <VDiskInfo data={vDiskData} className={vDiskPageCn('info')} wrap />;
    };

    const renderStorageDetails = () => {
        if (!newStorageViewEnabled) {
            return null;
        }

        return <VDiskStorageDetails data={vDiskData} className={vDiskPageCn('storage-details')} />;
    };

    const renderTabs = () => {
        return (
            <div className={vDiskPageCn('tabs')}>
                <TabProvider value={vDiskTab}>
                    <TabList size="l">
                        {VDISK_PAGE_TABS.map(({id, title}) => {
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
                {renderInfo()}
                {renderStorageDetails()}
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
