import React from 'react';

import {Unauthenticated} from '../../components/Errors/401';
import {AccessDenied} from '../../components/Errors/403';
import {LoaderWrapper} from '../../components/LoaderWrapper/LoaderWrapper';
import {
    useAllCapabilitiesLoaded,
    useCapabilitiesQuery,
    useMetaCapabilitiesQuery,
} from '../../store/reducers/capabilities/hooks';
import {nodesListApi} from '../../store/reducers/nodesList';
import {useDatabaseFromQuery} from '../../utils/hooks/useDatabaseFromQuery';
import {isForbiddenError, isRedirectToAuth, isUnauthenticatedError} from '../../utils/response';
import {GetUser} from '../GetUserWrapper/GetUserWrapper';

export function DataWrapper({children}: {children: React.ReactNode}) {
    return (
        // capabilities is going to work without authentication, but not all running systems are supporting this yet
        <GetCapabilities>
            <GetUser>
                <GetNodesList />
                {/* this GetCapabilities will be removed */}
                <GetCapabilities>{children}</GetCapabilities>
            </GetUser>
        </GetCapabilities>
    );
}

function GetNodesList() {
    const database = useDatabaseFromQuery();
    nodesListApi.useGetNodesListQuery({database}, undefined);
    return null;
}

function GetCapabilities({children}: {children: React.ReactNode}) {
    const {error} = useCapabilitiesQuery();

    useMetaCapabilitiesQuery();
    const capabilitiesLoaded = useAllCapabilitiesLoaded();

    //do nothing, authentication is in progress upon redirect
    if (isRedirectToAuth(error)) {
        return null;
    }

    if (isUnauthenticatedError(error)) {
        return <Unauthenticated />;
    }

    if (isForbiddenError(error)) {
        return <AccessDenied />;
    }

    return (
        <LoaderWrapper loading={!capabilitiesLoaded} size="l">
            {children}
        </LoaderWrapper>
    );
}
