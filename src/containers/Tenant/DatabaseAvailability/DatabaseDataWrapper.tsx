import React from 'react';

import {Alert, Button} from '@gravity-ui/uikit';

import {PageError} from '../../../components/Errors/PageError/PageError';
import {LoaderWrapper} from '../../../components/LoaderWrapper/LoaderWrapper';
import {useMetaCapabilitiesQuery} from '../../../store/reducers/capabilities/hooks';
import type {DatabaseAvailability} from '../../../store/reducers/tenant/availability';
import {uiFactory} from '../../../uiFactory/uiFactory';
import {cn} from '../../../utils/cn';
import {
    useClusterNameFromQuery,
    useDatabaseFromQuery,
} from '../../../utils/hooks/useDatabaseFromQuery';
import {DataWrapper} from '../../App/DataWrapper';

import {ControlPlaneUnavailable} from './ControlPlaneUnavailable';
import i18n from './i18n';
import {useDatabaseAvailability, useIsMetaDatabaseCandidate} from './useDatabaseAvailability';

import './DatabaseAvailability.scss';

const b = cn('ydb-runtime-lost-alert');

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
    const database = useDatabaseFromQuery() ?? '';
    const clusterName = useClusterNameFromQuery();
    const {availability, retry} = useDatabaseAvailability();
    const scope = `${clusterName}/${database}`;
    const runtimeShown = useRuntimeShown(availability.status, scope);

    // Once the runtime page is open, a later control plane only response must not unmount it:
    // the page keeps its state (e.g. an unsaved query) and the user is warned instead.
    const runtimeLost =
        runtimeShown &&
        (availability.status === 'control-plane' || availability.status === 'unavailable');

    if (runtimeLost || availability.status === 'runtime' || availability.status === 'legacy') {
        return (
            <React.Fragment>
                {runtimeLost ? (
                    <Alert
                        className={b()}
                        theme="warning"
                        layout="horizontal"
                        title={i18n('title_runtime-unavailable')}
                        message={i18n('description_runtime-lost')}
                        actions={<Button onClick={retry}>{i18n('action_retry')}</Button>}
                    />
                ) : null}
                <DataWrapper>{children}</DataWrapper>
            </React.Fragment>
        );
    }

    switch (availability.status) {
        case 'loading':
            return (
                <LoaderWrapper loading size="l">
                    {null}
                </LoaderWrapper>
            );
        case 'access-error':
            return (
                <PageError
                    error={availability.error}
                    {...uiFactory.clusterOrDatabaseAccessError}
                    size="l"
                />
            );
        case 'control-plane':
            return (
                <ControlPlaneUnavailable
                    key={scope}
                    database={database}
                    tenant={availability.tenant}
                    onRetry={retry}
                />
            );
        case 'unavailable':
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
}

/** Whether the regular (runtime) page was rendered for the current database scope. */
function useRuntimeShown(status: DatabaseAvailability['status'], scope: string) {
    const [runtimeScope, setRuntimeScope] = React.useState<string>();

    React.useEffect(() => {
        if (status === 'runtime') {
            setRuntimeScope(scope);
        } else if (status === 'loading' || status === 'access-error') {
            setRuntimeScope(undefined);
        }
    }, [status, scope]);

    return runtimeScope === scope;
}
