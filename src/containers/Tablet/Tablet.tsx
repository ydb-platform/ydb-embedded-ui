import React from 'react';

import {Flex, Tab, TabList, TabProvider} from '@gravity-ui/uikit';
import {skipToken} from '@reduxjs/toolkit/query';
import {Helmet} from 'react-helmet-async';
import {useParams} from 'react-router-dom';
import {useQueryParams} from 'use-query-params';
import {z} from 'zod';

import {EmptyStateWrapper} from '../../components/EmptyState';
import {EntityPageTitle} from '../../components/EntityPageTitle/EntityPageTitle';
import {ResponseError} from '../../components/Errors/ResponseError';
import {InternalLink} from '../../components/InternalLink';
import {LoaderWrapper} from '../../components/LoaderWrapper/LoaderWrapper';
import {PageMetaWithAutorefresh} from '../../components/PageMeta/PageMeta';
import {getTabletPagePath, tabletPageQueryParams} from '../../routes';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {tabletApi} from '../../store/reducers/tablet';
import {EFlag} from '../../types/api/enums';
import type {TTabletStateInfo} from '../../types/api/tablet';
import type {ITabletPreparedHistoryItem} from '../../types/store/tablet';
import {cn} from '../../utils/cn';
import {CLUSTER_DEFAULT_TITLE} from '../../utils/constants';
import {useAutoRefreshInterval, useTypedDispatch} from '../../utils/hooks';
import {useIsUserAllowedToMakeChanges} from '../../utils/hooks/useIsUserAllowedToMakeChanges';

import {TabletControls} from './components/TabletControls';
import {TabletInfo} from './components/TabletInfo';
import {TabletStorageInfo} from './components/TabletStorageInfo/TabletStorageInfo';
import {TabletTable} from './components/TabletTable';
import i18n from './i18n';
import {hasHive} from './utils';

import './Tablet.scss';

const b = cn('ydb-tablet-page');

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

export function Tablet() {
    const dispatch = useTypedDispatch();

    const {id} = useParams<{id: string}>();

    const [{database: queryDatabase, clusterName: queryClusterName, followerId: queryFollowerId}] =
        useQueryParams(tabletPageQueryParams);

    const database = queryDatabase?.toString();
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const {currentData, isFetching, error} = tabletApi.useGetTabletQuery(
        {id, database: queryDatabase ?? undefined, followerId: queryFollowerId ?? undefined},
        {pollingInterval: autoRefreshInterval},
    );

    const loading = isFetching && currentData === undefined;
    const {data: tablet = {}, history = []} = currentData || {};

    const {currentData: databaseFullPath} = tabletApi.useGetTabletDescribeQuery(
        tablet.TenantId ? {tenantId: tablet.TenantId, database} : skipToken,
    );

    const tabletType = tablet.Type;

    React.useEffect(() => {
        dispatch(
            setHeaderBreadcrumbs('tablet', {
                database,
                tabletId: id,
                tabletType,
                databaseName: databaseFullPath,
            }),
        );
    }, [dispatch, database, id, tabletType, databaseFullPath]);

    const {Leader} = tablet;
    const metaItems: string[] = [];
    if (databaseFullPath) {
        metaItems.push(`${i18n('tablet.meta-database')}: ${databaseFullPath}`);
    }
    // Add "Tablet" instead of tablet type to metadata
    metaItems.push(i18n('tablet.header'));
    if (Leader === false) {
        metaItems.push(i18n('tablet.meta-follower').toUpperCase());
    }

    return (
        <Flex gap={5} direction="column" className={b()}>
            <Helmet>
                <title>{`${id} — ${i18n('tablet.header')} — ${
                    databaseFullPath || queryClusterName || CLUSTER_DEFAULT_TITLE
                }`}</title>
            </Helmet>
            <PageMetaWithAutorefresh items={metaItems} />
            <LoaderWrapper loading={loading} size="l">
                {error ? <ResponseError error={error} /> : null}
                {currentData ? (
                    <TabletContent id={id} tablet={tablet} history={history} database={database} />
                ) : null}
            </LoaderWrapper>
        </Flex>
    );
}

function TabletContent({
    id,
    tablet,
    history,
    database,
}: {
    id: string;
    tablet: TTabletStateInfo;
    history: ITabletPreparedHistoryItem[];
    database?: string;
}) {
    const isEmpty = !Object.keys(tablet).length;
    const {Overall, HiveId, FollowerId, Type} = tablet;

    const tabletName = `${id}${FollowerId ? `.${FollowerId}` : ''}`;

    return (
        <EmptyStateWrapper
            title={i18n('emptyState')}
            className={b('placeholder')}
            isEmpty={isEmpty}
        >
            <Flex gap={5} direction="column">
                <EntityPageTitle
                    entityName={Type || i18n('tablet.header')}
                    status={Overall ?? EFlag.Grey}
                    id={tabletName}
                />
                <TabletControls tablet={tablet} />
                <TabletInfo tablet={tablet} />
            </Flex>
            <TabletTabs id={id} hiveId={HiveId} history={history} database={database} />
        </EmptyStateWrapper>
    );
}

function TabletTabs({
    id,
    hiveId,
    history,
    database,
}: {
    id: string;
    hiveId?: string;
    database?: string;
    history: ITabletPreparedHistoryItem[];
}) {
    const [{activeTab, ...restParams}, setParams] = useQueryParams(tabletPageQueryParams);
    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();

    const noAdvancedInfo = !isUserAllowedToMakeChanges || !hasHive(hiveId);

    let tabletTab = tabletTabSchema.parse(activeTab);
    if (noAdvancedInfo && TABLET_PAGE_TABS.find((tab) => tab.id === tabletTab)?.isAdvanced) {
        tabletTab = TABLET_TABS_IDS.history;
    }

    React.useEffect(() => {
        if (activeTab !== tabletTab) {
            setParams({activeTab: tabletTab}, 'replaceIn');
        }
    }, [activeTab, tabletTab, setParams]);

    return (
        <Flex gap={5} direction="column">
            {/* block wrapper fror tabs to preserve height */}
            <div>
                <TabProvider value={tabletTab}>
                    <TabList size="l">
                        {TABLET_PAGE_TABS.filter(({isAdvanced}) =>
                            isAdvanced ? !noAdvancedInfo : true,
                        ).map(({id: tabId, title}) => {
                            const path = getTabletPagePath(id, {...restParams, activeTab: tabId});
                            return (
                                <Tab key={tabId} value={tabId}>
                                    <InternalLink view="primary" as="tab" to={path}>
                                        {title}
                                    </InternalLink>
                                </Tab>
                            );
                        })}
                    </TabList>
                </TabProvider>
            </div>
            {tabletTab === 'history' ? (
                <TabletTable history={history} tabletId={id} database={database} />
            ) : null}
            {tabletTab === 'channels' && !noAdvancedInfo ? (
                <Channels id={id} hiveId={hiveId} />
            ) : null}
        </Flex>
    );
}

function Channels({id, hiveId}: {id: string; hiveId: string}) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const {currentData, error, isFetching} = tabletApi.useGetAdvancedTableInfoQuery(
        {id, hiveId},
        {
            pollingInterval: autoRefreshInterval,
        },
    );

    const loading = isFetching && currentData === undefined;

    return (
        <LoaderWrapper loading={loading} size="l">
            {error ? <ResponseError error={error} /> : null}
            {currentData ? <TabletStorageInfo data={currentData} /> : null}
        </LoaderWrapper>
    );
}
