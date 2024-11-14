import React from 'react';

import NiceModal from '@ebay/nice-modal-react';

import {useTypedSelector} from '..';
import {CONFIRMATION_DIALOG} from '../../../components/ConfirmationDialog/ConfirmationDialog';
import {selectIsQuerySaved} from '../../../store/reducers/executeQuery';

import i18n from './i18n';

export async function getConfirmation(): Promise<boolean> {
    return await NiceModal.show(CONFIRMATION_DIALOG, {
        id: CONFIRMATION_DIALOG,
        caption: i18n('context_unsaved-changes-warning'),
        textButtonApply: i18n('action_apply'),
    });
}

export function changeInputWithConfirmation<T>(callback: (args: T) => void) {
    return async (args: T) => {
        const confirmed = await getConfirmation();
        if (!confirmed) {
            return;
        }
        callback(args);
    };
}

export function useChangeInputWithConfirmation<T>(callback: (args: T) => void) {
    const isQuerySaved = useTypedSelector(selectIsQuerySaved);
    const callbackWithConfirmation = React.useMemo(
        () => changeInputWithConfirmation<T>(callback),
        [callback],
    );
    if (isQuerySaved) {
        return callback;
    }
    return callbackWithConfirmation;
}
