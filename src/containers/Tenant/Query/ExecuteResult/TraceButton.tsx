import {Button} from '@gravity-ui/uikit';
import {StringParam, useQueryParams} from 'use-query-params';

import {LinkWithIcon} from '../../../../components/LinkWithIcon/LinkWithIcon';
import {clusterApi} from '../../../../store/reducers/cluster/cluster';
import {traceApi} from '../../../../store/reducers/trace';
import type {TClusterInfo} from '../../../../types/api/cluster';
import {cn} from '../../../../utils/cn';
import {SECOND_IN_MS} from '../../../../utils/constants';
import {useDelayed} from '../../../../utils/hooks/useDelayed';
import {replaceParams} from '../utils/replaceParams';

import i18n from './i18n';

const b = cn('ydb-query-execute-result');

const TIME_BEFORE_CHECK = 15 * SECOND_IN_MS;

interface TraceUrlButtonProps {
    traceId?: string;
}

function hasValidTraceUrl(cluster?: TClusterInfo): cluster is {TraceCheck: {url: string}} {
    return Boolean(cluster && cluster.TraceCheck && typeof cluster.TraceCheck.url === 'string');
}

export function TraceButton({traceId}: TraceUrlButtonProps) {
    const [queryParams] = useQueryParams({clusterName: StringParam});

    const {data: {clusterData: cluster} = {}} = clusterApi.useGetClusterInfoQuery(
        queryParams.clusterName ?? undefined,
        {skip: !traceId},
    );

    const hasTraceCheck = Boolean(hasValidTraceUrl(cluster) && traceId);

    const checkTraceUrl =
        traceId && hasValidTraceUrl(cluster)
            ? replaceParams(cluster.TraceCheck.url, {traceId})
            : '';

    // We won't get any trace data at first 15 seconds for sure
    const readyToFetch = useDelayed(TIME_BEFORE_CHECK);

    const {currentData: traceData, error: traceError} = traceApi.useCheckTraceQuery(
        {url: checkTraceUrl},
        {skip: !hasTraceCheck || !readyToFetch},
    );

    const traceUrl =
        cluster?.TraceView?.url && traceId ? replaceParams(cluster.TraceView.url, {traceId}) : '';

    if (!traceUrl) {
        return null;
    }

    return (
        <Button view="flat-secondary" loading={!traceData && !traceError}>
            <LinkWithIcon
                className={b('trace-link', {loading: !traceData && !traceError})}
                title={i18n('trace')}
                url={traceUrl}
                external
            />
        </Button>
    );
}
