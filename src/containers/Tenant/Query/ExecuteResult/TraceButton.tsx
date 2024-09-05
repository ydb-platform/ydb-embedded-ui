import React from 'react';

import {ArrowUpRightFromSquare} from '@gravity-ui/icons';
import {Button} from '@gravity-ui/uikit';

import {useClusterBaseInfo} from '../../../../store/reducers/cluster/cluster';
import {traceApi} from '../../../../store/reducers/trace';
import {SECOND_IN_MS} from '../../../../utils/constants';
import {useDelayed} from '../../../../utils/hooks/useDelayed';
import {replaceParams} from '../utils/replaceParams';

import i18n from './i18n';

const TIME_BEFORE_CHECK = 15 * SECOND_IN_MS;

interface TraceUrlButtonProps {
    traceId: string;
}

export function TraceButton({traceId}: TraceUrlButtonProps) {
    const {traceCheck, traceView} = useClusterBaseInfo();

    const checkTraceUrl = traceCheck?.url ? replaceParams(traceCheck.url, {traceId}) : '';
    const traceUrl = traceView?.url ? replaceParams(traceView.url, {traceId}) : '';

    // We won't get any trace data at first 15 seconds for sure
    const [readyToFetch, resetDelay] = useDelayed(TIME_BEFORE_CHECK);

    React.useEffect(() => {
        resetDelay();
    }, [traceId, resetDelay]);

    const {isFetching} = traceApi.useCheckTraceQuery(
        {url: checkTraceUrl},
        {skip: !checkTraceUrl || !readyToFetch},
    );

    if (!traceUrl) {
        return null;
    }

    const loading = !readyToFetch || isFetching;
    return (
        <Button
            view={loading ? 'flat-secondary' : 'flat-info'}
            loading={loading}
            href={traceUrl}
            target="_blank"
        >
            {i18n('trace')}
            <Button.Icon>
                <ArrowUpRightFromSquare />
            </Button.Icon>
        </Button>
    );
}
