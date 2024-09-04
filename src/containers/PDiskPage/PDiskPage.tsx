import React from 'react';

import {ArrowRotateLeft} from '@gravity-ui/icons';
import {Icon, Tabs} from '@gravity-ui/uikit';
import {skipToken} from '@reduxjs/toolkit/query';
import {Helmet} from 'react-helmet-async';
import {StringParam, useQueryParams} from 'use-query-params';
import {z} from 'zod';

import {ButtonWithConfirmDialog} from '../../components/ButtonWithConfirmDialog/ButtonWithConfirmDialog';
import {EntityPageTitle} from '../../components/EntityPageTitle/EntityPageTitle';
import {ResponseError} from '../../components/Errors/ResponseError';
import {InfoViewerSkeleton} from '../../components/InfoViewerSkeleton/InfoViewerSkeleton';
import {InternalLink} from '../../components/InternalLink/InternalLink';
import {PDiskInfo} from '../../components/PDiskInfo/PDiskInfo';
import {PageMetaWithAutorefresh} from '../../components/PageMeta/PageMeta';
import {getPDiskPagePath} from '../../routes';
import {api} from '../../store/reducers/api';
import {selectIsUserAllowedToMakeChanges} from '../../store/reducers/authentication/authentication';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {pDiskApi} from '../../store/reducers/pdisk/pdisk';
import {valueIsDefined} from '../../utils';
import {getPDiskId, getSeverityColor} from '../../utils/disks/helpers';
import {useAutoRefreshInterval, useTypedDispatch, useTypedSelector} from '../../utils/hooks';

import {PDiskGroups} from './PDiskGroups/PDiskGroups';
import {PDiskSpaceDistribution} from './PDiskSpaceDistribution/PDiskSpaceDistribution';
import {pDiskPageKeyset} from './i18n';
import {pdiskPageCn} from './shared';

import './PDiskPage.scss';

const PDISK_TABS_IDS = {
    diskDistribution: 'diskDistribution',
    groups: 'groups',
} as const;

const PDISK_PAGE_TABS = [
    {
        id: PDISK_TABS_IDS.diskDistribution,
        get title() {
            return pDiskPageKeyset('disk-distribution');
        },
    },
    {
        id: PDISK_TABS_IDS.groups,
        get title() {
            return pDiskPageKeyset('groups');
        },
    },
];

const pDiskTabSchema = z.nativeEnum(PDISK_TABS_IDS).catch(PDISK_TABS_IDS.diskDistribution);

export function PDiskPage() {
    const dispatch = useTypedDispatch();

    const isUserAllowedToMakeChanges = useTypedSelector(selectIsUserAllowedToMakeChanges);

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
    const {NodeHost, NodeId, NodeType, NodeDC, Severity} = pDiskData || {};

    const handleRestart = async (isRetry?: boolean) => {
        if (pDiskParamsDefined) {
            return window.api.restartPDisk({nodeId, pDiskId, force: isRetry}).then((response) => {
                if (response?.result === false) {
                    const err = {
                        statusText: response.error,
                        retryPossible: response.forceRetryPossible,
                    };
                    throw err;
                }
            });
        }

        return undefined;
    };

    const handleAfterRestart = () => {
        if (pDiskParamsDefined) {
            dispatch(
                api.util.invalidateTags([{type: 'PDiskData', id: getPDiskId(nodeId, pDiskId)}]),
            );
        }
    };

    const renderHelmet = () => {
        const pDiskPagePart = pDiskId
            ? `${pDiskPageKeyset('pdisk')} ${pDiskId}`
            : pDiskPageKeyset('pdisk');

        const nodePagePart = NodeHost ? NodeHost : pDiskPageKeyset('node');

        return (
            <Helmet
                titleTemplate={`%s - ${pDiskPagePart} — ${nodePagePart} — YDB Monitoring`}
                defaultTitle={`${pDiskPagePart} — ${nodePagePart} — YDB Monitoring`}
            />
        );
    };

    const renderPageMeta = () => {
        const hostItem = NodeHost ? `${pDiskPageKeyset('fqdn')}: ${NodeHost}` : undefined;
        const nodeIdItem = NodeId ? `${pDiskPageKeyset('node')}: ${NodeId}` : undefined;

        return (
            <PageMetaWithAutorefresh
                loading={pDiskLoading}
                items={[hostItem, nodeIdItem, NodeType, NodeDC]}
                className={pdiskPageCn('meta')}
            />
        );
    };

    const renderPageTitle = () => {
        return (
            <EntityPageTitle
                entityName={pDiskPageKeyset('pdisk')}
                status={getSeverityColor(Severity)}
                id={getPDiskId(nodeId, pDiskId)}
                className={pdiskPageCn('title')}
            />
        );
    };

    const renderControls = () => {
        return (
            <div className={pdiskPageCn('controls')}>
                <ButtonWithConfirmDialog
                    onConfirmAction={handleRestart}
                    onConfirmActionSuccess={handleAfterRestart}
                    buttonDisabled={!nodeId || !pDiskId || !isUserAllowedToMakeChanges}
                    buttonView="normal"
                    dialogContent={pDiskPageKeyset('restart-pdisk-dialog')}
                    retryButtonText={pDiskPageKeyset('force-restart-pdisk-button')}
                    withPopover
                    popoverContent={pDiskPageKeyset('restart-pdisk-not-allowed')}
                    popoverDisabled={isUserAllowedToMakeChanges}
                >
                    <Icon data={ArrowRotateLeft} />
                    {pDiskPageKeyset('restart-pdisk-button')}
                </ButtonWithConfirmDialog>
            </div>
        );
    };

    const renderInfo = () => {
        if (pDiskLoading) {
            return <InfoViewerSkeleton className={pdiskPageCn('info')} rows={10} />;
        }
        return <PDiskInfo pDisk={pDiskData} nodeId={nodeId} className={pdiskPageCn('info')} />;
    };

    const renderTabs = () => {
        return (
            <div className={pdiskPageCn('tabs')}>
                <Tabs
                    size="l"
                    items={PDISK_PAGE_TABS}
                    activeTab={pDiskTab}
                    wrapTo={({id}, tabNode) => {
                        const path = pDiskParamsDefined
                            ? getPDiskPagePath(pDiskId, nodeId, {activeTab: id})
                            : undefined;
                        return (
                            <InternalLink to={path} key={id}>
                                {tabNode}
                            </InternalLink>
                        );
                    }}
                />
            </div>
        );
    };

    const renderTabsContent = () => {
        switch (pDiskTab) {
            case 'diskDistribution': {
                return pDiskData ? <PDiskSpaceDistribution data={pDiskData} /> : null;
            }
            case 'groups': {
                return pDiskParamsDefined ? (
                    <PDiskGroups nodeId={nodeId} pDiskId={pDiskId} />
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
        <div className={pdiskPageCn(null)}>
            {renderHelmet()}
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
