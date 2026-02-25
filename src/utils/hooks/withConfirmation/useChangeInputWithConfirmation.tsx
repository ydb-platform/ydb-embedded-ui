import React from 'react';

import NiceModal from '@ebay/nice-modal-react';

import {useTypedSelector} from '..';
import {selectIsDirty, selectUserInput} from '../../../store/reducers/query/query';

import {UNSAVED_CHANGES_DIALOG} from './UnsavedChangesDialog';

export async function getConfirmation(): Promise<boolean> {
    return await NiceModal.show(UNSAVED_CHANGES_DIALOG, {
        id: UNSAVED_CHANGES_DIALOG,
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

export function useChangeInputWithConfirmation<T>(
    callback: (args: T) => void,
    skipConfirmation?: boolean,
) {
    const userInput = useTypedSelector(selectUserInput);
    const isDirty = useTypedSelector(selectIsDirty);
    const callbackWithConfirmation = React.useMemo(
        () => changeInputWithConfirmation<T>(callback),
        [callback],
    );
    if (skipConfirmation || !userInput || !isDirty) {
        return callback;
    }
    return callbackWithConfirmation;
}
