import React from 'react';

import {DrawerContextProvider} from '../../components/Drawer/DrawerContext';
import {PageError} from '../../components/Errors/PageError/PageError';
import {LoaderWrapper} from '../../components/LoaderWrapper/LoaderWrapper';
import {authenticationApi} from '../../store/reducers/authentication/authentication';
import {uiFactory} from '../../uiFactory/uiFactory';
import {useDatabaseFromQuery} from '../../utils/hooks/useDatabaseFromQuery';
import {useMetaAuth} from '../../utils/hooks/useMetaAuth';
import {isForbiddenError} from '../../utils/response';
import {useAppTitle} from '../App/AppTitleContext';
import {SettingsBootstrap} from '../App/SettingsBootstrap';
import {TenantAccessError} from '../Tenant/TenantAccessError';

import {useHandleVisibilityChange} from './useHandleVisibilityChange';

export function GetUser({
    children,
    useMeta,
    // Allow content on databases home tab to be displayed even when whoami responds with an error
    displayWhoamiError = true,
}: {
    children: React.ReactNode;
    useMeta?: boolean;
    displayWhoamiError?: boolean;
}) {
    const database = useDatabaseFromQuery();

    const {currentData, isFetching, error, refetch} = authenticationApi.useWhoamiQuery({
        database,
        useMeta,
    });

    useHandleVisibilityChange(refetch);

    // Only the first request for the current database blocks the page: a background
    // revalidation (e.g. when the tab becomes visible again) must not unmount it.
    const loading = isFetching && currentData === undefined;

    const {appTitle} = useAppTitle();

    const errorToDisplay = displayWhoamiError ? error : undefined;

    const errorProps = errorToDisplay ? {...uiFactory.clusterOrDatabaseAccessError} : undefined;
    const databaseAccessPath = database?.startsWith('/') ? database : '';

    return (
        <LoaderWrapper loading={loading} size="l" delay={0}>
            {database && isForbiddenError(errorToDisplay) && uiFactory.access?.getErrorProps ? (
                <DrawerContextProvider>
                    <TenantAccessError
                        error={errorToDisplay}
                        errorPageTitle={appTitle}
                        source="database"
                        database={database}
                        databaseFullPath={databaseAccessPath}
                        path={databaseAccessPath}
                    />
                </DrawerContextProvider>
            ) : (
                <PageError
                    error={errorToDisplay}
                    {...errorProps}
                    size="l"
                    illustrationSize="m"
                    errorPageTitle={appTitle}
                >
                    <SettingsBootstrap>{children}</SettingsBootstrap>
                </PageError>
            )}
        </LoaderWrapper>
    );
}

export function GetMetaUser({
    children,
    displayWhoamiError,
}: {
    children: React.ReactNode;
    displayWhoamiError?: boolean;
}) {
    const metaAuth = useMetaAuth();

    if (metaAuth) {
        return (
            <GetUser displayWhoamiError={displayWhoamiError} useMeta>
                {children}
            </GetUser>
        );
    }
    return children;
}
