import React from 'react';

import {skipToken} from '@reduxjs/toolkit/query';
import {Helmet} from 'react-helmet-async';
import {StringParam, useQueryParams} from 'use-query-params';

import {EntityPageTitle} from '../../components/EntityPageTitle/EntityPageTitle';
import {ResponseError} from '../../components/Errors/ResponseError';
import {InfoViewerSkeleton} from '../../components/InfoViewerSkeleton/InfoViewerSkeleton';
import {PageMetaWithAutorefresh} from '../../components/PageMeta/PageMeta';
import {StorageGroupInfo} from '../../components/StorageGroupInfo/StorageGroupInfo';
import {
    useCapabilitiesLoaded,
    useStorageGroupsHandlerAvailable,
} from '../../store/reducers/capabilities/hooks';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {storageApi} from '../../store/reducers/storage/storage';
import {EFlag} from '../../types/api/enums';
import {valueIsDefined} from '../../utils';
import {cn} from '../../utils/cn';
import {useAutoRefreshInterval, useTypedDispatch} from '../../utils/hooks';
import {PaginatedStorage} from '../Storage/PaginatedStorage';

import {storageGroupPageKeyset} from './i18n';

import './StorageGroupPage.scss';

const storageGroupPageCn = cn('ydb-storage-group-page');

export function StorageGroupPage() {
    const dispatch = useTypedDispatch();
    const containerRef = React.useRef<HTMLDivElement>(null);

    const [{groupId}] = useQueryParams({groupId: StringParam});

    React.useEffect(() => {
        dispatch(setHeaderBreadcrumbs('storageGroup', {groupId}));
    }, [dispatch, groupId]);

    const [autoRefreshInterval] = useAutoRefreshInterval();
    const shouldUseGroupsHandler = useStorageGroupsHandlerAvailable();
    const capabilitiesLoaded = useCapabilitiesLoaded();
    const groupQuery = storageApi.useGetStorageGroupsInfoQuery(
        valueIsDefined(groupId)
            ? {groupId, shouldUseGroupsHandler, with: 'all', fieldsRequired: 'all'}
            : skipToken,
        {
            pollingInterval: autoRefreshInterval,
            skip: !capabilitiesLoaded,
        },
    );

    const storageGroupData = groupQuery.data?.groups?.[0];

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

        const items = [`${storageGroupPageKeyset('pool-name')}: ${storageGroupData?.PoolName}`];

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

    const renderStorage = () => {
        if (!groupId) {
            return null;
        }
        return (
            <React.Fragment>
                <div className={storageGroupPageCn('storage-title')}>
                    {storageGroupPageKeyset('storage')}
                </div>
                <PaginatedStorage
                    groupId={groupId}
                    scrollContainerRef={containerRef}
                    viewContext={{
                        groupId: groupId?.toString(),
                    }}
                />
            </React.Fragment>
        );
    };

    const renderError = () => {
        if (!groupQuery.error) {
            return null;
        }
        return <ResponseError error={groupQuery.error} />;
    };

    return (
        <div className={storageGroupPageCn(null)} ref={containerRef}>
            {renderHelmet()}
            {renderPageMeta()}
            {renderPageTitle()}
            {renderError()}
            {renderInfo()}
            {renderStorage()}
        </div>
    );
}
