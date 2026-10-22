import React from 'react';

import {Flex, Text} from '@gravity-ui/uikit';
import {skipToken} from '@reduxjs/toolkit/query';
import {Helmet} from 'react-helmet-async';
import {StringParam, useQueryParams} from 'use-query-params';

import {StickyAutoRefreshControl} from '../../components/AutoRefreshControl/StickyAutoRefreshControl';
import {CopyableValue} from '../../components/CopyableValue/CopyableValue';
import {ResponseError} from '../../components/Errors/ResponseError';
import {InfoViewerSkeleton} from '../../components/InfoViewerSkeleton/InfoViewerSkeleton';
import {StorageGroupInfo} from '../../components/StorageGroupInfo/StorageGroupInfo';
import {useCapabilitiesLoaded} from '../../store/reducers/capabilities/hooks';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {storageApi} from '../../store/reducers/storage/storage';
import {valueIsDefined} from '../../utils';
import {cn} from '../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {useAutoRefreshInterval, useTypedDispatch} from '../../utils/hooks';
import {useDatabaseFromQuery} from '../../utils/hooks/useDatabaseFromQuery';
import {useAppTitle} from '../App/AppTitleContext';
import {PaginatedStorage} from '../Storage/PaginatedStorage';
import {StorageGroupStateLabel} from '../Storage/StorageGroupStateLabel';

import {storageGroupPageKeyset} from './i18n';

import './StorageGroupPage.scss';

const storageGroupPageCn = cn('ydb-storage-group-page');

export function StorageGroupPage() {
    const dispatch = useTypedDispatch();
    const database = useDatabaseFromQuery();
    const containerRef = React.useRef<HTMLDivElement>(null);

    const [{groupId}] = useQueryParams({groupId: StringParam});

    const [autoRefreshInterval] = useAutoRefreshInterval();
    const capabilitiesLoaded = useCapabilitiesLoaded();
    const groupQuery = storageApi.useGetStorageGroupsInfoQuery(
        valueIsDefined(groupId)
            ? {groupId, with: 'all', fieldsRequired: 'all', database}
            : skipToken,
        {
            pollingInterval: autoRefreshInterval,
            skip: !capabilitiesLoaded,
        },
    );

    const storageGroupData = groupQuery.currentData?.groups?.[0];
    const state = storageGroupData?.State;

    React.useEffect(() => {
        dispatch(setHeaderBreadcrumbs('storageGroup', {groupId: groupId ?? undefined, database}));
    }, [dispatch, groupId, database]);

    const loading = groupQuery.isFetching && storageGroupData === undefined;
    const {appTitle} = useAppTitle();

    const renderHelmet = () => {
        const pageTitle = groupId
            ? `${storageGroupPageKeyset('storage-group')} ${groupId}`
            : storageGroupPageKeyset('storage-group');

        return (
            <Helmet
                titleTemplate={`%s - ${pageTitle} — ${appTitle}`}
                defaultTitle={`${pageTitle} — ${appTitle}`}
            />
        );
    };

    const renderPageTitle = () => {
        return (
            <Flex
                className={storageGroupPageCn('title')}
                alignItems="flex-start"
                gap={2}
                wrap="nowrap"
            >
                <Flex
                    className={storageGroupPageCn('title-content')}
                    alignItems="center"
                    gap={2}
                    wrap="wrap"
                >
                    <Text variant="header-1">{storageGroupPageKeyset('storage-group')}</Text>
                    <CopyableValue
                        copyText={groupId}
                        fieldName={storageGroupPageKeyset('storage-group')}
                        copyButtonLabel={storageGroupPageKeyset('action_copy-group-id-from-title')}
                    >
                        <Text variant="header-1" color="hint">
                            {groupId || EMPTY_DATA_PLACEHOLDER}
                        </Text>
                    </CopyableValue>
                    <StorageGroupStateLabel state={state} />
                </Flex>
            </Flex>
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
                <Text as="h2" variant="subheader-3" className={storageGroupPageCn('storage-title')}>
                    {storageGroupPageKeyset('storage')}
                </Text>
                <PaginatedStorage
                    database={database}
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
            {groupId ? <StickyAutoRefreshControl /> : null}
            <div className={storageGroupPageCn('summary')}>
                {renderPageTitle()}
                {renderError()}
                {renderInfo()}
            </div>
            {renderStorage()}
        </div>
    );
}
