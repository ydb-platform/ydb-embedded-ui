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
import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import {useNodesListQueryArgs} from '../../utils/hooks/useNodesListQueryArgs';
import {useSetting} from '../../utils/hooks/useSetting';
import {isForbiddenError, isRedirectToAuth, isUnauthenticatedError} from '../../utils/response';
import {GetUser} from '../GetUserWrapper/GetUserWrapper';

interface DataWrapperProps {
    children: React.ReactNode;
    /**
     * The database runtime does not respond and the page shows what is left without it:
     * an operational whoami failure must not replace the page, runtime data is not requested.
     */
    runtimeUnavailable?: boolean;
}

export function DataWrapper({children, runtimeUnavailable}: DataWrapperProps) {
    return (
        // capabilities is going to work without authentication, but not all running systems are supporting this yet
        <GetCapabilities>
            <GetUser displayWhoamiError={!runtimeUnavailable}>
                {runtimeUnavailable ? null : <GetNodesList />}
                {/* this GetCapabilities will be removed */}
                <GetCapabilities>{children}</GetCapabilities>
            </GetUser>
        </GetCapabilities>
    );
}

function GetNodesList() {
    // Load the remote setting here; cache readers only use its value from the store.
    useSetting(SETTING_KEYS.TENANT_INITIAL_PAGE);
    const args = useNodesListQueryArgs();
    nodesListApi.useGetNodesListQuery(args);
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
