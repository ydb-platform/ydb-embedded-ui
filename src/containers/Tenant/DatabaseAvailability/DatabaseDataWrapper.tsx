import React from 'react';

import {Button} from '@gravity-ui/uikit';

import {PageError} from '../../../components/Errors/PageError/PageError';
import {LoaderWrapper} from '../../../components/LoaderWrapper/LoaderWrapper';
import {useMetaCapabilitiesQuery} from '../../../store/reducers/capabilities/hooks';
import type {DatabaseAvailability} from '../../../store/reducers/tenant/availability';
import {setRuntimeSeenScope} from '../../../store/reducers/tenant/tenant';
import {uiFactory} from '../../../uiFactory/uiFactory';
import {useTypedDispatch} from '../../../utils/hooks';
import {DataWrapper} from '../../App/DataWrapper';

import i18n from './i18n';
import {useDatabaseRuntimeState, useIsMetaDatabaseCandidate} from './useDatabaseAvailability';

export function DatabaseDataWrapper({children}: {children: React.ReactNode}) {
    const candidate = useIsMetaDatabaseCandidate();

    return candidate ? (
        <MetaDatabaseDataWrapper>{children}</MetaDatabaseDataWrapper>
    ) : (
        <DataWrapper>{children}</DataWrapper>
    );
}

function MetaDatabaseDataWrapper({children}: {children: React.ReactNode}) {
    useMetaCapabilitiesQuery();
    const {availability, retry, scope, runtimeUnavailable, coldStart} = useDatabaseRuntimeState();
    useTrackRuntimeSeen(availability.status, scope);

    if (availability.status === 'loading') {
        return (
            <LoaderWrapper loading size="l">
                {null}
            </LoaderWrapper>
        );
    }
    if (availability.status === 'access-error') {
        return (
            <PageError
                error={availability.error}
                {...uiFactory.clusterOrDatabaseAccessError}
                size="l"
            />
        );
    }
    // Neither the runtime nor the control plane can be shown
    if (availability.status === 'unavailable' && coldStart) {
        return (
            <PageError
                error={availability.error}
                size="l"
                actions={[
                    <Button key="retry" onClick={retry}>
                        {i18n('action_retry')}
                    </Button>,
                ]}
            />
        );
    }

    // The regular page is rendered in every other case. Without the runtime it shows
    // control plane data, so an operational whoami failure must not replace it.
    return <DataWrapper runtimeUnavailable={runtimeUnavailable}>{children}</DataWrapper>;
}

/** Remembers that the runtime responded for the current database while the page is open. */
function useTrackRuntimeSeen(status: DatabaseAvailability['status'], scope: string) {
    const dispatch = useTypedDispatch();

    React.useEffect(() => {
        if (status === 'runtime') {
            dispatch(setRuntimeSeenScope(scope));
        } else if (status === 'loading' || status === 'access-error') {
            dispatch(setRuntimeSeenScope(undefined));
        }
    }, [dispatch, status, scope]);

    React.useEffect(() => {
        return () => {
            dispatch(setRuntimeSeenScope(undefined));
        };
    }, [dispatch]);
}
