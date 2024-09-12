import React from 'react';

import {Tabs} from '@gravity-ui/uikit';
import {skipToken} from '@reduxjs/toolkit/query';
import {Helmet} from 'react-helmet-async';
import {StringParam, useQueryParams} from 'use-query-params';
import {z} from 'zod';

import {EntityPageTitle} from '../../components/EntityPageTitle/EntityPageTitle';
import {ResponseError} from '../../components/Errors/ResponseError';
import {InfoViewerSkeleton} from '../../components/InfoViewerSkeleton/InfoViewerSkeleton';
import {InternalLink} from '../../components/InternalLink';
import {PageMetaWithAutorefresh} from '../../components/PageMeta/PageMeta';
import {StorageGroupInfo} from '../../components/StorageGroupInfo/StorageGroupInfo';
import {getStorageGroupPath} from '../../routes';
import {useStorageGroupsHandlerAvailable} from '../../store/reducers/capabilities/hooks';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {STORAGE_TYPES} from '../../store/reducers/storage/constants';
import {storageApi} from '../../store/reducers/storage/storage';
import {EFlag} from '../../types/api/enums';
import {valueIsDefined} from '../../utils';
import {cn} from '../../utils/cn';
import {DEFAULT_TABLE_SETTINGS} from '../../utils/constants';
import {useAutoRefreshInterval, useTypedDispatch} from '../../utils/hooks';
import {NodesUptimeFilterValues} from '../../utils/nodes';
import {StorageGroups} from '../Storage/StorageGroups/StorageGroups';
import {StorageNodes} from '../Storage/StorageNodes/StorageNodes';

import {storageGroupPageKeyset} from './i18n';

import './StorageGroupPage.scss';

const STORAGE_GROUP_PAGE_TABS = [
    {
        id: STORAGE_TYPES.groups,
        get title() {
            return storageGroupPageKeyset('group');
        },
    },
    {
        id: STORAGE_TYPES.nodes,
        get title() {
            return storageGroupPageKeyset('nodes');
        },
    },
];

const storageGroupPageCn = cn('ydb-storage-group-page');

const storageGroupTabSchema = z.nativeEnum(STORAGE_TYPES).catch(STORAGE_TYPES.groups);

export function StorageGroupPage() {
    const dispatch = useTypedDispatch();

    const [{groupId, activeTab}] = useQueryParams({
        groupId: StringParam,
        activeTab: StringParam,
    });

    const storageGroupTab = storageGroupTabSchema.parse(activeTab);

    React.useEffect(() => {
        dispatch(setHeaderBreadcrumbs('storageGroup', {groupId}));
    }, [dispatch, groupId]);

    const [autoRefreshInterval] = useAutoRefreshInterval();
    const shouldUseGroupsHandler = useStorageGroupsHandlerAvailable();
    const groupQuery = storageApi.useGetStorageGroupsInfoQuery(
        valueIsDefined(groupId) ? {groupId, shouldUseGroupsHandler} : skipToken,
        {
            pollingInterval: autoRefreshInterval,
        },
    );

    const nodesQuery = storageApi.useGetStorageNodesInfoQuery(
        storageGroupTab === STORAGE_TYPES.nodes ? {} : skipToken,
        {
            pollingInterval: autoRefreshInterval,
        },
    );

    const storageGroupData = groupQuery.data?.groups?.[0];
    const nodesData = nodesQuery.data?.nodes;

    const loading = groupQuery.isFetching && storageGroupData === undefined;

    const renderHelmet = () => {
        const pageTitle = groupId
            ? `${storageGroupPageKeyset('storage-group')} ${groupId}`
            : storageGroupPageKeyset('storage-group');

        return (
            <Helmet
                titleTemplate={`%s - ${pageTitle} — YDB Monitoring`}
                defaultTitle={`${pageTitle} — YDB Monitoring`}
            />
        );
    };

    const renderPageMeta = () => {
        if (!groupId) {
            return null;
        }

        const items = [`${storageGroupPageKeyset('storage-group')}: ${groupId}`];

        return (
            <PageMetaWithAutorefresh
                className={storageGroupPageCn('meta')}
                loading={loading}
                items={items}
            />
        );
    };

    const renderPageTitle = () => {
        return (
            <EntityPageTitle
                className={storageGroupPageCn('title')}
                entityName={storageGroupPageKeyset('storage-group')}
                status={storageGroupData?.Overall || EFlag.Grey}
                id={groupId}
            />
        );
    };

    const renderInfo = () => {
        if (loading) {
            return <InfoViewerSkeleton className={storageGroupPageCn('info')} rows={10} />;
        }
        return <StorageGroupInfo data={storageGroupData} className={storageGroupPageCn('info')} />;
    };

    const renderTabs = () => {
        return (
            <div className={storageGroupPageCn('tabs')}>
                <Tabs
                    size="l"
                    items={STORAGE_GROUP_PAGE_TABS}
                    activeTab={storageGroupTab}
                    wrapTo={({id}, tabNode) => {
                        const path = groupId
                            ? getStorageGroupPath(groupId, {activeTab: id})
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
        switch (storageGroupTab) {
            case 'groups': {
                return storageGroupData ? (
                    <StorageGroups
                        data={[storageGroupData]}
                        tableSettings={DEFAULT_TABLE_SETTINGS}
                        visibleEntities="all"
                    />
                ) : null;
            }
            case 'nodes': {
                return nodesData ? (
                    <StorageNodes
                        data={nodesData}
                        tableSettings={DEFAULT_TABLE_SETTINGS}
                        visibleEntities="all"
                        nodesUptimeFilter={NodesUptimeFilterValues.All}
                    />
                ) : null;
            }
            default:
                return null;
        }
    };

    const renderError = () => {
        if (!groupQuery.error && !nodesQuery.error) {
            return null;
        }
        return <ResponseError error={groupQuery.error || nodesQuery.error} />;
    };

    return (
        <div className={storageGroupPageCn()}>
            {renderHelmet()}
            {renderPageMeta()}
            {renderPageTitle()}
            {renderError()}
            {renderInfo()}
            {renderTabs()}
            {renderTabsContent()}
        </div>
    );
}
