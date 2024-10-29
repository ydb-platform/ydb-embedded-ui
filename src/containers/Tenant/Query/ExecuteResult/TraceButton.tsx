import React from 'react';

import {ArrowUpRightFromSquare} from '@gravity-ui/icons';
import {Button} from '@gravity-ui/uikit';

import {useClusterBaseInfo} from '../../../../store/reducers/cluster/cluster';
import {traceApi} from '../../../../store/reducers/trace';
import {replaceParams} from '../utils/replaceParams';

import i18n from './i18n';

interface TraceUrlButtonProps {
    traceId: string;
}

export function TraceButton({traceId}: TraceUrlButtonProps) {
    const {traceCheck, traceView} = useClusterBaseInfo();

    const checkTraceUrl = traceCheck?.url ? replaceParams(traceCheck.url, {traceId}) : '';
    const traceUrl = traceView?.url ? replaceParams(traceView.url, {traceId}) : '';

    const [checkTrace, {isLoading, isUninitialized}] = traceApi.useCheckTraceMutation();

    React.useEffect(() => {
        let checkTraceMutation: {abort: () => void} | null;
        if (checkTraceUrl) {
            checkTraceMutation = checkTrace({url: checkTraceUrl});
        }

        return () => checkTraceMutation?.abort();
    }, [checkTrace, checkTraceUrl]);

    if (!traceUrl || isUninitialized) {
        return null;
    }

    return (
        <Button
            view={isLoading ? 'flat-secondary' : 'flat-info'}
            loading={isLoading}
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
