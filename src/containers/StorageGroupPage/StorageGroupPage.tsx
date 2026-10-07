import React from 'react';

import {ArrowLeft} from '@gravity-ui/icons';
import {Button, ClipboardButton, Flex, Icon, Text} from '@gravity-ui/uikit';
import {skipToken} from '@reduxjs/toolkit/query';
import {Helmet} from 'react-helmet-async';
import {useHistory} from 'react-router-dom';
import {StringParam, useQueryParams} from 'use-query-params';

import {AutoRefreshControl} from '../../components/AutoRefreshControl/AutoRefreshControl';
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
    const history = useHistory();
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
        dispatch(
            setHeaderBreadcrumbs('storageGroup', {groupId: groupId ?? undefined, database, state}),
        );
    }, [dispatch, groupId, database, state]);

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

    const renderPageMeta = () => {
        if (!groupId) {
            return null;
        }

        const hasPreviousPage = history.length > 1;

        return (
            <Flex
                className={storageGroupPageCn('meta')}
                alignItems="center"
                justifyContent={hasPreviousPage ? 'space-between' : 'flex-end'}
                gap={2}
            >
                {hasPreviousPage && (
                    <Button view="outlined" onClick={() => history.goBack()}>
                        <Icon data={ArrowLeft} />
                        {storageGroupPageKeyset('action_back')}
                    </Button>
                )}
                <AutoRefreshControl />
            </Flex>
        );
    };

    const renderPageTitle = () => {
        return (
            <Flex className={storageGroupPageCn('title')} alignItems="center" gap={2} wrap="wrap">
                <Text variant="header-1">{storageGroupPageKeyset('storage-group')}</Text>
                <Flex alignItems="center" gap={1}>
                    <Text variant="header-1" color="hint">
                        {groupId || EMPTY_DATA_PLACEHOLDER}
                    </Text>
                    {groupId && (
                        <ClipboardButton
                            text={groupId}
                            view="flat-secondary"
                            size="s"
                            aria-label={storageGroupPageKeyset('action_copy-group-id')}
                            tooltipInitialText={storageGroupPageKeyset('action_copy-group-id')}
                        />
                    )}
                </Flex>
                <StorageGroupStateLabel state={state} />
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
                <div className={storageGroupPageCn('storage-title')}>
                    {storageGroupPageKeyset('storage')}
                </div>
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
            <div className={storageGroupPageCn('summary')}>
                {renderPageMeta()}
                {renderPageTitle()}
                {renderError()}
                {renderInfo()}
            </div>
            {renderStorage()}
        </div>
    );
}
