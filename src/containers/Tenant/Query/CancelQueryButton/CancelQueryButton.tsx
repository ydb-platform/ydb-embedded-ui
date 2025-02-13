import {StopFill} from '@gravity-ui/icons';
import {Button, Icon} from '@gravity-ui/uikit';

import {cn} from '../../../../utils/cn';
import i18n from '../i18n';

import './CancelQueryButton.scss';

const b = cn('cancel-query-button');

interface CancelQueryButtonProps {
    isLoading: boolean;
    isError: boolean;
    onClick?: VoidFunction;
}

export function CancelQueryButton({isLoading, isError, onClick}: CancelQueryButtonProps) {
    return (
        <Button
            loading={isLoading}
            onClick={onClick}
            className={b('stop-button', {error: isError})}
        >
            <Icon data={StopFill} size={16} />
            {i18n('action.stop')}
        </Button>
    );
}
