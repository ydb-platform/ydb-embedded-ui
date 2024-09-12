import React from 'react';

import {StopFill} from '@gravity-ui/icons';
import {Button, Icon} from '@gravity-ui/uikit';

import {cancelQueryApi} from '../../../../store/reducers/cancelQuery';
import {cn} from '../../../../utils/cn';
import i18n from '../i18n';

import './CancelQueryButton.scss';

const b = cn('cancel-query-button');

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
        <Button
            loading={cancelQueryResponse.isLoading}
            onClick={onStopButtonClick}
            className={b('stop-button', {error: Boolean(cancelQueryResponse.error)})}
        >
            <Icon data={StopFill} size={16} />
            {i18n('action.stop')}
        </Button>
    );
}
