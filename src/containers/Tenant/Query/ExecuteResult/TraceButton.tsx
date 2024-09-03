import {Button} from '@gravity-ui/uikit';
import {StringParam, useQueryParams} from 'use-query-params';

import {LinkWithIcon} from '../../../../components/LinkWithIcon/LinkWithIcon';
import {clusterApi} from '../../../../store/reducers/cluster/cluster';
import {traceApi} from '../../../../store/reducers/trace';
import {cn} from '../../../../utils/cn';
import {replaceParams} from '../utils/replaceParams';

import i18n from './i18n';

const b = cn('ydb-query-execute-result');

interface TraceUrlButtonProps {
    traceId?: string;
}

export function TraceButton({traceId}: TraceUrlButtonProps) {
    const [queryParams] = useQueryParams({clusterName: StringParam});

    const {data: {clusterData: cluster} = {}} = clusterApi.useGetClusterInfoQuery(
        queryParams.clusterName ?? undefined,
    );

    const hasTraceCheck = Boolean(cluster?.TraceCheck?.url && traceId);

    const checkTraceUrl = traceId ? replaceParams(cluster!.TraceCheck!.url!, {traceId}) : '';

    const {currentData: traceData, error: traceError} = traceApi.useCheckTraceQuery(
        {url: checkTraceUrl},
        {skip: !traceId || !hasTraceCheck},
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
