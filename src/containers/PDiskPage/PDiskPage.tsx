import React from 'react';

import {ArrowLeft, ArrowRotateLeft, Wrench} from '@gravity-ui/icons';
import {Button, Flex, Icon, Tab, TabList, TabProvider, Text} from '@gravity-ui/uikit';
import {skipToken} from '@reduxjs/toolkit/query';
import {Helmet} from 'react-helmet-async';
import {useHistory} from 'react-router-dom';
import {StringParam, useQueryParams} from 'use-query-params';
import {z} from 'zod';

import {StickyAutoRefreshControl} from '../../components/AutoRefreshControl/StickyAutoRefreshControl';
import {ButtonWithConfirmDialog} from '../../components/ButtonWithConfirmDialog/ButtonWithConfirmDialog';
import {CopyableValue} from '../../components/CopyableValue/CopyableValue';
import {DiskStatusLabel, DiskTypeLabel} from '../../components/DiskStatus/DiskStatus';
import {ResponseError} from '../../components/Errors/ResponseError';
import {InfoViewerSkeleton} from '../../components/InfoViewerSkeleton/InfoViewerSkeleton';
import {InternalLink} from '../../components/InternalLink/InternalLink';
import {LinkWithIcon} from '../../components/LinkWithIcon/LinkWithIcon';
import {PDiskInfo} from '../../components/PDiskInfo/PDiskInfo';
import {
    getPDiskDecommitLabel,
    getPDiskDriveLabel,
    getPDiskMaintenanceLabel,
    getPDiskStateLabel,
} from '../../components/PDiskInfo/statuses';
import {getPDiskPagePath} from '../../routes';
import {api} from '../../store/reducers/api';
import {useDiskPagesAvailable} from '../../store/reducers/capabilities/hooks';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {pDiskApi} from '../../store/reducers/pdisk/pdisk';
import {valueIsDefined} from '../../utils';
import {cn} from '../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {createPDiskDeveloperUILink, useHasDeveloperUi} from '../../utils/developerUI/developerUI';
import {getPDiskId} from '../../utils/disks/helpers';
import {useAutoRefreshInterval, useTypedDispatch} from '../../utils/hooks';
import {useBrowserCanGoBack} from '../../utils/hooks/useBrowserCanGoBack';
import {useIsUserAllowedToMakeChanges} from '../../utils/hooks/useIsUserAllowedToMakeChanges';
import {useAppTitle} from '../App/AppTitleContext';
import {PaginatedStorage} from '../Storage/PaginatedStorage';

import {PDiskSpaceDistribution} from './PDiskSpaceDistribution/PDiskSpaceDistribution';
import {PDiskStorageDetails} from './PDiskStorageDetails';
import {pDiskPageKeyset} from './i18n';

import './PDiskPage.scss';

const pdiskPageCn = cn('ydb-pdisk-page');

const PDISK_TABS_IDS = {
    spaceDistribution: 'spaceDistribution',
    storage: 'storage',
} as const;

const PDISK_PAGE_TABS = [
    {
        id: PDISK_TABS_IDS.spaceDistribution,
        get title() {
            return pDiskPageKeyset('space-distribution');
        },
    },
    {
        id: PDISK_TABS_IDS.storage,
        get title() {
            return pDiskPageKeyset('storage');
        },
    },
];

const pDiskTabSchema = z.nativeEnum(PDISK_TABS_IDS).catch(PDISK_TABS_IDS.spaceDistribution);

export function PDiskPage() {
    const dispatch = useTypedDispatch();
    const history = useHistory();
    const showBackButton = useBrowserCanGoBack(history) ?? true;
    const hasDeveloperUi = useHasDeveloperUi();

    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();
    const newDiskApiAvailable = useDiskPagesAvailable();
    const containerRef = React.useRef<HTMLDivElement>(null);

    const [{nodeId, pDiskId, activeTab}] = useQueryParams({
        activeTab: StringParam,
        nodeId: StringParam,
        pDiskId: StringParam,
    });

    const pDiskParamsDefined = valueIsDefined(nodeId) && valueIsDefined(pDiskId);

    const pDiskTab = pDiskTabSchema.parse(activeTab);

    React.useEffect(() => {
        dispatch(setHeaderBreadcrumbs('pDisk', {nodeId, pDiskId}));
    }, [dispatch, nodeId, pDiskId]);

    const [autoRefreshInterval] = useAutoRefreshInterval();
    const params = pDiskParamsDefined ? {nodeId, pDiskId} : skipToken;
    const pdiskDataQuery = pDiskApi.useGetPdiskInfoQuery(params, {
        pollingInterval: autoRefreshInterval,
    });
    const pDiskLoading = pdiskDataQuery.isFetching && pdiskDataQuery.currentData === undefined;
    const pDiskData = pdiskDataQuery.currentData;
    const {NodeHost, DecommitStatus} = pDiskData || {};
    const diskId = getPDiskId({nodeId, pDiskId});

    const handleRestart = async (isRetry?: boolean) => {
        if (pDiskParamsDefined) {
            const response = await window.api.pdisk[
                newDiskApiAvailable ? 'restartPDisk' : 'restartPDiskOld'
            ]({nodeId, pDiskId, force: isRetry});

            if (response?.result === false) {
                const err = {
                    statusText: response.error,
                    retryPossible: response.forceRetryPossible,
                };
                throw err;
            }
        }
    };

    const handleAfterAction = () => {
        if (pDiskParamsDefined) {
            dispatch(
                api.util.invalidateTags([{type: 'PDiskData', id: getPDiskId({nodeId, pDiskId})}]),
                'StorageData',
            );
        }
    };

    const {appTitle} = useAppTitle();

    const renderHelmet = () => {
        const pDiskPagePart = pDiskId
            ? `${pDiskPageKeyset('pdisk')} ${pDiskId}`
            : pDiskPageKeyset('pdisk');

        const nodePagePart = NodeHost ? NodeHost : pDiskPageKeyset('node');

        return (
            <Helmet
                titleTemplate={`%s - ${pDiskPagePart} — ${nodePagePart} — ${appTitle}`}
                defaultTitle={`${pDiskPagePart} — ${nodePagePart} — ${appTitle}`}
            />
        );
    };

    const renderPageMeta = () => {
        if (!showBackButton) {
            return null;
        }

        return (
            <Flex
                className={pdiskPageCn('meta')}
                alignItems="center"
                justifyContent="space-between"
                gap={1}
            >
                <Button size="m" view="outlined" onClick={() => history.goBack()}>
                    <Icon data={ArrowLeft} size={16} />
                    {pDiskPageKeyset('action_back')}
                </Button>
            </Flex>
        );
    };

    const renderPageTitle = () => {
        const statusLabels = [
            {id: 'state', label: getPDiskStateLabel(pDiskData?.State)},
            {id: 'drive', label: getPDiskDriveLabel(pDiskData?.DriveStatus)},
            {id: 'decommit', label: getPDiskDecommitLabel(DecommitStatus)},
            {id: 'maintenance', label: getPDiskMaintenanceLabel(pDiskData?.MaintenanceStatus)},
        ];
        return (
            <Flex
                className={pdiskPageCn('title', {'with-refresh': !showBackButton})}
                gap={2}
                alignItems="flex-start"
                qa="pdisk-header"
            >
                <Flex
                    className={pdiskPageCn('title-content')}
                    gap={3}
                    alignItems="center"
                    wrap="wrap"
                >
                    <CopyableValue copyText={diskId} fieldName={pDiskPageKeyset('pdisk')}>
                        <Text as="h1" variant="header-1" className={pdiskPageCn('heading')}>
                            {pDiskPageKeyset('pdisk')}{' '}
                            <Text color="hint" variant="header-1">
                                {diskId || EMPTY_DATA_PLACEHOLDER}
                            </Text>
                        </Text>
                    </CopyableValue>
                    <Flex gap={2} alignItems="center" wrap="wrap">
                        {statusLabels.map(({id, label}) =>
                            label ? <DiskStatusLabel key={id} {...label} iconSize={14} /> : null,
                        )}
                        <DiskTypeLabel type={pDiskData?.Type} size="s" />
                    </Flex>
                </Flex>
            </Flex>
        );
    };

    const renderControls = () => {
        return (
            <div className={pdiskPageCn('controls')} data-qa="pdisk-controls">
                <ButtonWithConfirmDialog
                    onConfirmAction={handleRestart}
                    onConfirmActionSuccess={handleAfterAction}
                    buttonDisabled={!pDiskParamsDefined || !isUserAllowedToMakeChanges}
                    buttonView="action"
                    dialogHeader={pDiskPageKeyset('restart-pdisk-dialog-header')}
                    dialogText={pDiskPageKeyset('restart-pdisk-dialog-text')}
                    applyButtonText={pDiskPageKeyset('restart-pdisk-button')}
                    applyButtonView="action"
                    retryButtonText={pDiskPageKeyset('force-restart-pdisk-button')}
                    withPopover
                    popoverContent={pDiskPageKeyset('restart-pdisk-not-allowed')}
                    popoverDisabled={isUserAllowedToMakeChanges}
                >
                    <Icon data={ArrowRotateLeft} />
                    {pDiskPageKeyset('restart-pdisk-button')}
                </ButtonWithConfirmDialog>
                {hasDeveloperUi && pDiskParamsDefined && (
                    <LinkWithIcon
                        title={pDiskPageKeyset('action_open-in-developer-ui')}
                        url={createPDiskDeveloperUILink({nodeId, pDiskId})}
                        icon={Wrench}
                        hideEndIcon
                    />
                )}
            </div>
        );
    };

    const renderInfo = () => {
        if (pDiskLoading) {
            return <InfoViewerSkeleton className={pdiskPageCn('info')} rows={10} />;
        }
        return (
            <React.Fragment>
                <PDiskStorageDetails data={pDiskData} className={pdiskPageCn('storage-details')} />
                <PDiskInfo pDisk={pDiskData} className={pdiskPageCn('info')} />
            </React.Fragment>
        );
    };

    const renderTabs = () => {
        return (
            <div className={pdiskPageCn('tabs')}>
                <TabProvider value={pDiskTab}>
                    <TabList size="l">
                        {PDISK_PAGE_TABS.map(({id, title}) => {
                            const path = pDiskParamsDefined
                                ? getPDiskPagePath(pDiskId, nodeId, {activeTab: id})
                                : undefined;
                            return (
                                <Tab key={id} value={id}>
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

    const renderTabsContent = () => {
        switch (pDiskTab) {
            case 'spaceDistribution': {
                return pDiskData ? (
                    <div className={pdiskPageCn('disk-distribution')}>
                        <PDiskSpaceDistribution data={pDiskData} />
                    </div>
                ) : null;
            }
            case 'storage': {
                return pDiskParamsDefined ? (
                    <PaginatedStorage
                        nodeId={nodeId}
                        pDiskId={pDiskId}
                        scrollContainerRef={containerRef}
                        viewContext={{
                            nodeId: nodeId?.toString(),
                            pDiskId: pDiskId?.toString(),
                        }}
                    />
                ) : null;
            }
            default:
                return null;
        }
    };

    const renderError = () => {
        if (!pdiskDataQuery.error) {
            return null;
        }
        return <ResponseError error={pdiskDataQuery.error} />;
    };

    return (
        <div className={pdiskPageCn(null)} ref={containerRef}>
            {renderHelmet()}
            <StickyAutoRefreshControl />
            {renderPageMeta()}
            {renderPageTitle()}
            {renderControls()}
            {renderError()}
            {renderInfo()}
            {renderTabs()}
            {renderTabsContent()}
        </div>
    );
}
