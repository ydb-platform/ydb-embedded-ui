import React from 'react';

import {Flex, Tabs} from '@gravity-ui/uikit';
import {skipToken} from '@reduxjs/toolkit/query';
import {Helmet} from 'react-helmet-async';
import {useParams} from 'react-router-dom';
import {StringParam, useQueryParams} from 'use-query-params';
import {z} from 'zod';

import {EmptyStateWrapper} from '../../components/EmptyState';
import {EntityPageTitle} from '../../components/EntityPageTitle/EntityPageTitle';
import {ResponseError} from '../../components/Errors/ResponseError';
import {InternalLink} from '../../components/InternalLink';
import {LoaderWrapper} from '../../components/LoaderWrapper/LoaderWrapper';
import {PageMetaWithAutorefresh} from '../../components/PageMeta/PageMeta';
import {getTabletPagePath} from '../../routes';
import {selectIsUserAllowedToMakeChanges} from '../../store/reducers/authentication/authentication';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {nodeApi} from '../../store/reducers/node/node';
import {tabletApi} from '../../store/reducers/tablet';
import {EFlag} from '../../types/api/enums';
import type {TTabletStateInfo} from '../../types/api/tablet';
import {EType} from '../../types/api/tablet';
import type {ITabletPreparedHistoryItem} from '../../types/store/tablet';
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
const eTypeSchema = z.nativeEnum(EType).or(z.undefined()).catch(undefined);

const tabletQueryParams = {
    nodeId: StringParam,
    tenantName: StringParam,
    type: StringParam,
    clusterName: StringParam,
    activeTab: StringParam,
};

export function Tablet() {
    const dispatch = useTypedDispatch();

    const {id} = useParams<{id: string}>();

    const [
        {
            nodeId: queryNodeId,
            tenantName: queryDatabase,
            type: queryTabletType,
            clusterName: queryClusterName,
        },
    ] = useQueryParams(tabletQueryParams);

    const [autoRefreshInterval] = useAutoRefreshInterval();
    const {currentData, isFetching, error} = tabletApi.useGetTabletQuery(
        {id, database: queryDatabase ?? undefined, nodeId: queryNodeId ?? undefined},
        {pollingInterval: autoRefreshInterval},
    );

    const loading = isFetching && currentData === undefined;
    const {data: tablet = {}, history = []} = currentData || {};

    const {currentData: tenantPath} = tabletApi.useGetTabletDescribeQuery(
        tablet.TenantId ? {tenantId: tablet.TenantId} : skipToken,
    );

    const nodeId = tablet.NodeId ?? queryNodeId ?? undefined;
    const database = (tenantPath || queryDatabase) ?? undefined;

    const nodeRole = useNodeRole(nodeId?.toString());

    const tabletType = tablet.Type || eTypeSchema.parse(queryTabletType);

    React.useEffect(() => {
        dispatch(
            setHeaderBreadcrumbs('tablet', {
                nodeId,
                nodeRole,
                tenantName: queryDatabase ?? undefined,
                tabletId: id,
                tabletType,
            }),
        );
    }, [dispatch, queryDatabase, id, nodeId, nodeRole, tabletType]);

    const {Leader, Type} = tablet;
    const metaItems: string[] = [];
    if (database) {
        metaItems.push(`${i18n('tablet.meta-database')}: ${database}`);
    }
    if (Type) {
        metaItems.push(Type);
    }
    if (Leader === false) {
        metaItems.push(i18n('tablet.meta-follower').toUpperCase());
    }

    return (
        <Flex gap={5} direction="column" className={b()}>
            <Helmet>
                <title>{`${id} — ${i18n('tablet.header')} — ${
                    database || queryClusterName || CLUSTER_DEFAULT_TITLE
                }`}</title>
            </Helmet>
            <PageMetaWithAutorefresh items={metaItems} />
            <LoaderWrapper loading={loading} size="l">
                {error ? <ResponseError error={error} /> : null}
                {currentData ? <TabletContent id={id} tablet={tablet} history={history} /> : null}
            </LoaderWrapper>
        </Flex>
    );
}

function TabletContent({
    id,
    tablet,
    history,
}: {
    id: string;
    tablet: TTabletStateInfo;
    history: ITabletPreparedHistoryItem[];
}) {
    const isEmpty = !Object.keys(tablet).length;
    const {Overall, HiveId} = tablet;

    return (
        <EmptyStateWrapper
            title={i18n('emptyState')}
            className={b('placeholder')}
            isEmpty={isEmpty}
        >
            <Flex gap={5} direction="column">
                <EntityPageTitle
                    entityName={i18n('tablet.header')}
                    status={Overall ?? EFlag.Grey}
                    id={id}
                />
                <TabletControls tablet={tablet} />
                <TabletInfo tablet={tablet} />
            </Flex>
            <TabletTabs id={id} hiveId={HiveId} history={history} />
        </EmptyStateWrapper>
    );
}

function TabletTabs({
    id,
    hiveId,
    history,
}: {
    id: string;
    hiveId?: string;
    history: ITabletPreparedHistoryItem[];
}) {
    const [{activeTab, ...restParams}, setParams] = useQueryParams(tabletQueryParams);
    const isUserAllowedToMakeChanges = useTypedSelector(selectIsUserAllowedToMakeChanges);

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
                <Tabs
                    size="l"
                    items={TABLET_PAGE_TABS.filter(({isAdvanced}) =>
                        isAdvanced ? !noAdvancedInfo : true,
                    )}
                    activeTab={tabletTab}
                    wrapTo={(tab, tabNode) => {
                        const path = getTabletPagePath(id, {...restParams, activeTab: tab.id});
                        return (
                            <InternalLink to={path} key={tab.id}>
                                {tabNode}
                            </InternalLink>
                        );
                    }}
                />
            </div>
            {tabletTab === 'history' ? <TabletTable history={history} /> : null}
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

function useNodeRole(nodeId: string | undefined) {
    const {currentData: node} = nodeApi.useGetNodeInfoQuery(nodeId ? {nodeId} : skipToken);

    let nodeRole: 'Storage' | 'Compute' | undefined;

    if (node) {
        // Compute nodes have tenantName, storage nodes doesn't
        const isStorage = !node?.Tenants?.[0];
        nodeRole = isStorage ? 'Storage' : 'Compute';
    }

    return nodeRole;
}
