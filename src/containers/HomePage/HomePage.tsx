import React from 'react';

import {Flex, SegmentedRadioGroup, Text} from '@gravity-ui/uikit';
import {Helmet} from 'react-helmet-async';
import {Redirect, Route, Switch, useHistory, useLocation} from 'react-router-dom';

import {AutoRefreshControl} from '../../components/AutoRefreshControl/AutoRefreshControl';
import {DrawerContextProvider} from '../../components/Drawer/DrawerContext';
import {PageError} from '../../components/Errors/PageError/PageError';
import {LoaderWrapper} from '../../components/LoaderWrapper/LoaderWrapper';
import type {HomePageTab} from '../../routes';
import {
    getClustersPath,
    getDatabasesPath,
    getHomePagePath,
    getLocationObjectFromHref,
    homePageTabSchema,
} from '../../routes';
import {useMetaEnvironmentsAvailable} from '../../store/reducers/capabilities/hooks';
import {environmentsApi} from '../../store/reducers/environments/environments';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import {uiFactory} from '../../uiFactory/uiFactory';
import {cn} from '../../utils/cn';
import {useSetting, useTypedDispatch} from '../../utils/hooks';
import {useIsViewerUser} from '../../utils/hooks/useIsUserAllowedToMakeChanges';
import {getRedirectLocation} from '../../utils/queryParams';
import {isAccessError} from '../../utils/response';
import {Clusters} from '../Clusters/Clusters';
import {GetMetaUser} from '../GetUserWrapper/GetUserWrapper';
import {TenantsTable} from '../Tenants/TenantsTable';

import i18n from './i18n';
import {useDatabasesPageEnvironment} from './useDatabasesPageEnvironment';
import {useHomePageTab} from './useHomePageTab';

import './HomePage.scss';

const b = cn('ydb-home-page');

export function HomePage() {
    const dispatch = useTypedDispatch();
    const history = useHistory();
    const location = useLocation();

    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    const tabFromPath = useHomePageTab();

    const metaEnvironmentsAvailable = useMetaEnvironmentsAvailable();
    const isViewerUser = useIsViewerUser();

    const [savedHomePageTab, saveHomePageTab] = useSetting<HomePageTab>(SETTING_KEYS.HOME_PAGE_TAB);

    const {
        data: environments,
        isLoading: environmentsLoading,
        error: environmentsError,
    } = environmentsApi.useGetMetaEnvironmentsQuery(undefined, {
        skip: !metaEnvironmentsAvailable,
    });

    const noEnvironmentsAvailable =
        !metaEnvironmentsAvailable ||
        (!environmentsLoading && (!environments || environments?.length === 0));

    const homePageTab = React.useMemo<HomePageTab>(() => {
        if (!metaEnvironmentsAvailable) {
            return 'clusters';
        }
        if (!isViewerUser) {
            return 'databases';
        }

        return homePageTabSchema.catch(savedHomePageTab).parse(tabFromPath);
    }, [isViewerUser, tabFromPath, savedHomePageTab, metaEnvironmentsAvailable]);

    const {databasesPageEnvironment, handleEnvironmentChange} = useDatabasesPageEnvironment(
        environments,
        {syncToUrl: homePageTab === 'databases'},
    );

    const initialPageTitle =
        homePageTab === 'clusters' ? i18n('page-title_clusters') : i18n('page-title_databases');
    const pageTitleWithFactory = uiFactory.homePageTitle ?? initialPageTitle;
    const showBlockingError = isAccessError(environmentsError);
    const errorProps = showBlockingError ? uiFactory.clusterOrDatabaseAccessError : undefined;

    const hasEnvironmentsTabs =
        homePageTab === 'databases' && environments && environments?.length > 1;

    React.useEffect(() => {
        dispatch(setHeaderBreadcrumbs('homePage', {}));
    }, [dispatch]);

    const environmentsTabs = React.useMemo(() => {
        const getEnvironmentTitle = uiFactory.databasesEnvironmentsConfig?.getEnvironmentTitle;
        return environments?.map((env) => {
            return {
                title: getEnvironmentTitle?.(env) ?? env,
                value: env,
            };
        });
    }, [environments]);

    const handleTabChange = React.useCallback(
        (value: HomePageTab) => {
            saveHomePageTab(value);
            // Clusters and databases lists share the `search` param, keep it when switching tabs.
            // The input writes to the URL with a debounce, so take the text user actually sees
            const search =
                scrollContainerRef.current?.querySelector<HTMLInputElement>(
                    '.ydb-search input',
                )?.value;
            const path = getHomePagePath({activeTab: value}, {search: search || undefined});
            history.replace(path);
        },
        [history, saveHomePageTab],
    );

    const handleEnvironmentTabChange = React.useCallback(
        (value: string) => {
            const envDomain = uiFactory.databasesEnvironmentsConfig?.getEnvironmentDomain?.(value);

            if (envDomain) {
                const newPath = new URL(getDatabasesPath({env: value}), envDomain).toString();

                window.location.href = newPath;
            } else {
                handleEnvironmentChange(value);
            }
        },
        [handleEnvironmentChange],
    );

    const renderHelmet = () => {
        return (
            <Helmet>
                <title>{initialPageTitle}</title>
            </Helmet>
        );
    };

    const renderDBEnvironmentsTabs = () => {
        if (!hasEnvironmentsTabs) {
            return null;
        }

        // <div> wrapper ensures proper button width
        return (
            <div>
                <SegmentedRadioGroup
                    size="l"
                    value={databasesPageEnvironment}
                    onUpdate={handleEnvironmentTabChange}
                >
                    {environmentsTabs?.map(({title, value}) => {
                        return (
                            <SegmentedRadioGroup.Option key={value} value={value}>
                                {title}
                            </SegmentedRadioGroup.Option>
                        );
                    })}
                </SegmentedRadioGroup>
            </div>
        );
    };

    const renderTabs = () => {
        if (noEnvironmentsAvailable || (!isViewerUser && !hasEnvironmentsTabs)) {
            return (
                <Flex
                    gap={4}
                    direction="row"
                    justifyContent="space-between"
                    className={b('controls-wrapper')}
                >
                    <Text variant="header-1">{pageTitleWithFactory}</Text>
                    <AutoRefreshControl />
                </Flex>
            );
        }
        if (!isViewerUser) {
            return (
                <Flex gap={4} direction="column" className={b('controls-wrapper')}>
                    <Text variant="header-1">{pageTitleWithFactory}</Text>
                    <Flex direction="row" justifyContent="space-between">
                        {renderDBEnvironmentsTabs()}
                        <AutoRefreshControl />
                    </Flex>
                </Flex>
            );
        }
        return (
            <Flex direction="row" justifyContent="space-between" className={b('controls-wrapper')}>
                <Flex gap={4} direction="row">
                    <SegmentedRadioGroup size="l" value={homePageTab} onUpdate={handleTabChange}>
                        <SegmentedRadioGroup.Option value="clusters">
                            {i18n('value_all-clusters')}
                        </SegmentedRadioGroup.Option>
                        <SegmentedRadioGroup.Option value="databases">
                            {i18n('value_my-databases')}
                        </SegmentedRadioGroup.Option>
                    </SegmentedRadioGroup>
                    {renderDBEnvironmentsTabs()}
                </Flex>
                <AutoRefreshControl />
            </Flex>
        );
    };

    const renderContent = () => {
        const clustersPath = getLocationObjectFromHref(getClustersPath()).pathname;
        const databasesPath = getLocationObjectFromHref(getDatabasesPath()).pathname;

        if (noEnvironmentsAvailable && homePageTab !== 'clusters') {
            return <Redirect to={getRedirectLocation(location, clustersPath)} />;
        }
        if (homePageTab !== tabFromPath) {
            const path = getLocationObjectFromHref(
                getHomePagePath({activeTab: homePageTab}),
            ).pathname;
            return <Redirect to={getRedirectLocation(location, path)} />;
        }

        return (
            <Switch>
                <Route path={clustersPath}>
                    <Clusters scrollContainerRef={scrollContainerRef} />
                </Route>
                <Route path={databasesPath}>
                    <TenantsTable
                        clusterName={undefined}
                        environmentName={databasesPageEnvironment}
                        myDatabases
                        isMetaDatabasesAvailable={true}
                        scrollContainerRef={scrollContainerRef}
                        additionalTenantsProps={undefined}
                        showPoolsColumn={false}
                        showWithProblemsFilter={false}
                    />
                </Route>
            </Switch>
        );
    };

    return (
        <PageError
            error={showBlockingError ? environmentsError : undefined}
            {...errorProps}
            size="l"
            illustrationSize="m"
            errorPageTitle={pageTitleWithFactory}
        >
            <LoaderWrapper loading={environmentsLoading}>
                {renderHelmet()}
                <GetMetaUser>
                    <DrawerContextProvider className={b('drawer-context')}>
                        <Flex direction="column" className={b()} ref={scrollContainerRef}>
                            {renderTabs()}
                            <Flex className={b('content-wrapper')}>{renderContent()}</Flex>
                        </Flex>
                    </DrawerContextProvider>
                </GetMetaUser>
            </LoaderWrapper>
        </PageError>
    );
}
