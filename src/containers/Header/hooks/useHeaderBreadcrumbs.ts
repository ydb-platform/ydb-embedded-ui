import React from 'react';

import type {HomePageTab} from '../../../routes';
import {environment} from '../../../store';
import type {BreadcrumbsOptions, Page} from '../../../store/reducers/header/types';
import type {RawBreadcrumbItem} from '../breadcrumbs';
import {getBreadcrumbs} from '../breadcrumbs';

export interface BreadcrumbItem extends RawBreadcrumbItem {
    action: () => void;
}

interface UseHeaderBreadcrumbsParams {
    page?: Page;
    pageBreadcrumbsOptions: BreadcrumbsOptions;
    singleClusterMode: boolean;
    isViewerUser?: boolean;
    isV2NavigationEnabled: boolean;
    homePageTabFromPath?: HomePageTab;
    savedHomePageTab?: HomePageTab;
    savedDatabasesEnvironment?: string;
    databasesPageAvailable?: boolean;
    clusterTitle?: string;
    isClustersHomePage: boolean;
    isDatabasesHomePage: boolean;
}

const NOOP = () => {};

export function useHeaderBreadcrumbs({
    page,
    pageBreadcrumbsOptions,
    singleClusterMode,
    isViewerUser,
    isV2NavigationEnabled,
    homePageTabFromPath,
    savedHomePageTab,
    savedDatabasesEnvironment,
    databasesPageAvailable,
    clusterTitle,
    isClustersHomePage,
    isDatabasesHomePage,
}: UseHeaderBreadcrumbsParams): BreadcrumbItem[] {
    return React.useMemo(() => {
        const options = {
            ...pageBreadcrumbsOptions,
            singleClusterMode,
            isViewerUser,
            isV2NavigationEnabled,
            environment,
            homePageTab: homePageTabFromPath ?? savedHomePageTab,
            databasesPageEnvironment: savedDatabasesEnvironment,
            databasesPageAvailable,
            ...(clusterTitle ? {clusterName: clusterTitle} : undefined),
        };

        const breadcrumbs = getBreadcrumbs(page, options);

        return breadcrumbs.map((item) => ({...item, action: NOOP}));
    }, [
        clusterTitle,
        page,
        isClustersHomePage,
        isDatabasesHomePage,
        databasesPageAvailable,
        homePageTabFromPath,
        savedHomePageTab,
        savedDatabasesEnvironment,
        pageBreadcrumbsOptions,
        singleClusterMode,
        isViewerUser,
        isV2NavigationEnabled,
    ]);
}
