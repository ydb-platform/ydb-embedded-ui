import React from 'react';

import {StringParam, useQueryParam} from 'use-query-params';
import {z} from 'zod';

import {
    useEmMetaAvailable,
    useGetMetaFeatureVersion,
    useMetaCapabilitiesLoaded,
} from '../../store/reducers/capabilities/hooks';
import {useClusterBaseInfo} from '../../store/reducers/cluster/cluster';
import {useTenantBaseInfo} from '../../store/reducers/tenant/tenant';
import {backend, environment} from '../../store/runtimeParams';

const operationSourceSchema = z.enum(['database', 'control-plane']).catch('control-plane');

export function useOperationsSource(database: string, controlPlaneOnly: boolean) {
    const {name: clusterName} = useClusterBaseInfo();
    const {controlPlane, databaseData, isError: tenantError} = useTenantBaseInfo(database);
    const emMetaAvailable = useEmMetaAvailable();
    const listOperationsAvailable = useGetMetaFeatureVersion('/meta/list_operations') >= 1;
    const metaCapabilitiesLoaded = useMetaCapabilitiesLoaded();
    const [rawSource, setSource] = useQueryParam('operationSource', StringParam);
    const requestedSource = operationSourceSchema.parse(rawSource);
    const cpAvailable = Boolean(
        emMetaAvailable &&
            listOperationsAvailable &&
            clusterName &&
            controlPlane?.id &&
            controlPlane?.folder_id,
    );
    const source =
        cpAvailable && (controlPlaneOnly || requestedSource === 'control-plane')
            ? 'control-plane'
            : 'database';
    const isControlPlane = source === 'control-plane';
    React.useEffect(() => {
        if (
            !controlPlaneOnly &&
            rawSource === 'control-plane' &&
            metaCapabilitiesLoaded &&
            !cpAvailable &&
            (databaseData || tenantError)
        ) {
            setSource('database', 'replaceIn');
        }
    }, [
        controlPlaneOnly,
        rawSource,
        metaCapabilitiesLoaded,
        cpAvailable,
        databaseData,
        tenantError,
        setSource,
    ]);
    const currentEnvironment = environment;
    const currentBackend = backend;
    const controlPlaneParams = React.useMemo(() => {
        if (!isControlPlane || !clusterName || !controlPlane?.id || !controlPlane.folder_id) {
            return undefined;
        }
        return {
            clusterName,
            databaseId: controlPlane.id,
            folderId: controlPlane.folder_id,
            environment: currentEnvironment,
            backend: currentBackend,
        };
    }, [
        isControlPlane,
        clusterName,
        controlPlane?.id,
        controlPlane?.folder_id,
        currentEnvironment,
        currentBackend,
    ]);
    const skipDatabase =
        controlPlaneOnly ||
        (requestedSource === 'control-plane' &&
            emMetaAvailable &&
            (!metaCapabilitiesLoaded || (!databaseData && !tenantError)));
    return {source, setSource, cpAvailable, isControlPlane, controlPlaneParams, skipDatabase};
}
