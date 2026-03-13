import React from 'react';

import {PageError} from '../../components/Errors/PageError/PageError';
import {LoaderWrapper} from '../../components/LoaderWrapper/LoaderWrapper';
import {authenticationApi} from '../../store/reducers/authentication/authentication';
import {uiFactory} from '../../uiFactory/uiFactory';
import {useDatabaseFromQuery} from '../../utils/hooks/useDatabaseFromQuery';
import {useMetaAuth} from '../../utils/hooks/useMetaAuth';
import {useAppTitle} from '../App/AppTitleContext';
import {SettingsBootstrap} from '../App/SettingsBootstrap';

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

    const {isFetching, error, refetch} = authenticationApi.useWhoamiQuery({
        database,
        useMeta,
    });

    useHandleVisibilityChange(refetch);

    const {appTitle} = useAppTitle();

    const errorToDisplay = displayWhoamiError ? error : undefined;

    const errorProps = errorToDisplay ? {...uiFactory.clusterOrDatabaseAccessError} : undefined;

    return (
        <LoaderWrapper loading={isFetching} size="l" delay={0}>
            <PageError
                error={errorToDisplay}
                {...errorProps}
                size="l"
                illustrationSize="m"
                errorPageTitle={appTitle}
            >
                <SettingsBootstrap>{children}</SettingsBootstrap>
            </PageError>
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
