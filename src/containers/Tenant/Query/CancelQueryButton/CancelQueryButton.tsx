import React from 'react';

import {StopFill} from '@gravity-ui/icons';
import {Button, Icon} from '@gravity-ui/uikit';

import ElapsedTime from '../../../../components/ElapsedTime/ElapsedTime';
import {cancelQueryApi} from '../../../../store/reducers/cancelQuery';
import {cn} from '../../../../utils/cn';
import i18n from '../i18n';

import './CancelQueryButton.scss';

const b = cn('basic-node-viewer');

interface CancelQueryButtonProps {
    queryId: string;
    tenantName: string;
}

export function CancelQueryButton({queryId, tenantName}: CancelQueryButtonProps) {
    const [sendCancelQuery, cancelQueryResponse] = cancelQueryApi.useCancelQueryMutation();

    const onStopButtonClick = React.useCallback(() => {
        sendCancelQuery({queryId, database: tenantName});
    }, [queryId, sendCancelQuery, tenantName]);

    return (
        <React.Fragment>
            <ElapsedTime className={b('elapsed-time')} />
            <Button
                loading={cancelQueryResponse.isLoading}
                onClick={onStopButtonClick}
                className={b('stop-button', {error: Boolean(cancelQueryResponse.error)})}
            >
                <Icon data={StopFill} size={16} />
                {i18n('action.stop')}
            </Button>
        </React.Fragment>
    );
}
