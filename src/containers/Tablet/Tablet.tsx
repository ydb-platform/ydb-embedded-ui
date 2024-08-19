import React from 'react';

import {Flex, Tabs} from '@gravity-ui/uikit';
import {skipToken} from '@reduxjs/toolkit/query';
import {Helmet} from 'react-helmet-async';
import {useLocation, useParams} from 'react-router-dom';
import {StringParam, useQueryParams} from 'use-query-params';
import {z} from 'zod';

import {EmptyStateWrapper} from '../../components/EmptyState';
import {EntityPageTitle} from '../../components/EntityPageTitle/EntityPageTitle';
import {ResponseError} from '../../components/Errors/ResponseError';
import {InternalLink} from '../../components/InternalLink';
import {LoaderWrapper} from '../../components/LoaderWrapper/LoaderWrapper';
import {PageMetaWithAutorefresh} from '../../components/PageMeta/PageMeta';
import {getTabletPagePath, parseQuery} from '../../routes';
import {selectIsUserAllowedToMakeChanges} from '../../store/reducers/authentication/authentication';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {tabletApi} from '../../store/reducers/tablet';
import {EFlag} from '../../types/api/enums';
import type {EType} from '../../types/api/tablet';
import {cn} from '../../utils/cn';
import {CLUSTER_DEFAULT_TITLE} from '../../utils/constants';
import {useAutoRefreshInterval, useTypedDispatch, useTypedSelector} from '../../utils/hooks';

import {TabletControls} from './components/TabletControls';
import {TabletInfo} from './components/TabletInfo';
import {TabletStorageInfo} from './components/TabletStorageInfo/TabletStorageInfo';
import {TabletTable} from './components/TabletTable';
import i18n from './i18n';
import {hasHive} from './utils';

import './Tablet.scss';

export const b = cn('ydb-tablet-page');

const TABLET_TABS_IDS = {
    history: 'history',
    channels: 'channels',
} as const;

const TABLET_PAGE_TABS = [
    {
        id: TABLET_TABS_IDS.history,
        get title() {
            return i18n('label_tablet-history');
        },
    },
    {
        id: TABLET_TABS_IDS.channels,
        get title() {
            return i18n('label_tablet-channels');
        },
        isAdvanced: true,
    },
];

const tabletTabSchema = z.nativeEnum(TABLET_TABS_IDS).catch(TABLET_TABS_IDS.history);

export const Tablet = () => {
    const dispatch = useTypedDispatch();
    const location = useLocation();
    const isUserAllowedToMakeChanges = useTypedSelector(selectIsUserAllowedToMakeChanges);

    const {id} = useParams<{id: string}>();

    const [{activeTab}, setParams] = useQueryParams({
        activeTab: StringParam,
    });

    const tabletTab = tabletTabSchema.parse(activeTab);

    const {
        nodeId: queryNodeId,
        tenantName: queryTenantName,
        type: queryTabletType,
        clusterName: queryClusterName,
    } = parseQuery(location);

    const [autoRefreshInterval] = useAutoRefreshInterval();
    const {currentData, isFetching, error, refetch} = tabletApi.useGetTabletQuery(
        {id, database: queryTenantName?.toString()},
        {pollingInterval: autoRefreshInterval},
    );

    const loading = isFetching && currentData === undefined;
    const {id: tabletId, data: tablet = {}, history = []} = currentData || {};

    const {currentData: tenantPath} = tabletApi.useGetTabletDescribeQuery(
        tablet.TenantId ? {tenantId: tablet.TenantId} : skipToken,
    );

    const hasHiveId = hasHive(tablet.HiveId);

    const noAdvancedInfo = !isUserAllowedToMakeChanges || !hasHiveId;

    React.useEffect(() => {
        if (loading) {
            return;
        }
        if (noAdvancedInfo && TABLET_PAGE_TABS.find(({id}) => id === tabletTab)?.isAdvanced) {
            setParams({activeTab: TABLET_TABS_IDS.history});
        }
    }, [noAdvancedInfo, tabletTab, setParams, loading]);

    const {
        currentData: advancedData,
        refetch: refetchAdvancedInfo,
        isFetching: isFetchingAdvancedData,
    } = tabletApi.useGetAdvancedTableInfoQuery(
        {id, hiveId: tablet.HiveId},
        {
            pollingInterval: autoRefreshInterval,
            skip: noAdvancedInfo || activeTab !== 'channels',
        },
    );

    const refetchTabletInfo = React.useCallback(async () => {
        await Promise.all([refetch(), refetchAdvancedInfo()]);
    }, [refetch, refetchAdvancedInfo]);

    const nodeId = tablet.NodeId?.toString() || queryNodeId?.toString();
    const tenantName = tenantPath || queryTenantName?.toString();

    const type = tablet.Type || (queryTabletType?.toString() as EType | undefined);

    React.useEffect(() => {
        dispatch(
            setHeaderBreadcrumbs('tablet', {
                nodeIds: nodeId ? [nodeId] : [],
                tenantName,
                tabletId: id,
                tabletType: type,
            }),
        );
    }, [dispatch, tenantName, id, nodeId, type]);

    const renderPageMeta = () => {
        const {Leader, Type} = tablet;
        const database = tenantName ? `${i18n('tablet.meta-database')}: ${tenantName}` : undefined;
        const type = Type ? Type : undefined;
        const follower = Leader === false ? i18n('tablet.meta-follower').toUpperCase() : undefined;

        return <PageMetaWithAutorefresh items={[database, type, follower]} />;
    };

    const renderHelmet = () => {
        return (
            <Helmet>
                <title>{`${id} — ${i18n('tablet.header')} — ${
                    tenantName || queryClusterName || CLUSTER_DEFAULT_TITLE
                }`}</title>
            </Helmet>
        );
    };

    const renderTabs = () => {
        return (
            //block wrapper for tabs
            <div>
                <Tabs
                    size="l"
                    items={TABLET_PAGE_TABS.filter(({isAdvanced}) =>
                        isAdvanced ? !noAdvancedInfo : true,
                    )}
                    activeTab={tabletTab}
                    wrapTo={({id}, tabNode) => {
                        const path = tabletId
                            ? getTabletPagePath(tabletId, {activeTab: id})
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
        switch (tabletTab) {
            case 'channels': {
                return (
                    <LoaderWrapper
                        loading={isFetchingAdvancedData && advancedData === undefined}
                        size="l"
                    >
                        <TabletStorageInfo data={advancedData} />
                    </LoaderWrapper>
                );
            }
            case 'history': {
                return <TabletTable history={history} />;
            }
            default:
                return null;
        }
    };

    const renderView = () => {
        if (error && !currentData) {
            return <ResponseError error={error} />;
        }

        const {TabletId, Overall} = tablet;
        return (
            <React.Fragment>
                {error ? <ResponseError error={error} /> : null}
                <Flex gap={5} direction="column">
                    <EntityPageTitle
                        entityName={i18n('tablet.header')}
                        status={Overall ?? EFlag.Grey}
                        id={TabletId}
                    />
                    <TabletControls tablet={tablet} fetchData={refetchTabletInfo} />
                    <TabletInfo tablet={tablet} />
                </Flex>
            </React.Fragment>
        );
    };
    return (
        <Flex gap={5} direction="column" className={b()}>
            {renderHelmet()}
            {renderPageMeta()}
            <LoaderWrapper loading={loading} size="l">
                <EmptyStateWrapper
                    title={i18n('emptyState')}
                    className={b('placeholder')}
                    isEmpty={!tablet || !Object.keys(tablet).length}
                >
                    {renderView()}
                    {renderTabs()}
                    {renderTabsContent()}
                </EmptyStateWrapper>
            </LoaderWrapper>
        </Flex>
    );
};
