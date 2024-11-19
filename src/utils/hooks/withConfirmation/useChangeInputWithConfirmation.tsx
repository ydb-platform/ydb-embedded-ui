import React from 'react';

import NiceModal from '@ebay/nice-modal-react';

import {useTypedSelector} from '..';
import {CONFIRMATION_DIALOG} from '../../../components/ConfirmationDialog/ConfirmationDialog';
import {SaveQueryButton} from '../../../containers/Tenant/Query/SaveQuery/SaveQuery';
import {selectUserInput} from '../../../store/reducers/query/query';

import i18n from './i18n';

function ExtendedSaveQueryButton() {
    const modal = NiceModal.useModal(CONFIRMATION_DIALOG);

    const closeModal = React.useCallback(() => {
        modal.hide();
        modal.remove();
    }, [modal]);
    const handleSaveQuerySuccess = React.useCallback(() => {
        modal.resolve(true);
        closeModal();
    }, [modal, closeModal]);
    const handleCancelQuerySave = React.useCallback(() => {
        modal.resolve(false);
        closeModal();
    }, [closeModal, modal]);

    const dialogProps = React.useMemo(
        () => ({
            onSuccess: handleSaveQuerySuccess,
            onCancel: handleCancelQuerySave,
        }),
        [handleSaveQuerySuccess, handleCancelQuerySave],
    );

    return <SaveQueryButton view="action" size="l" dialogProps={dialogProps} />;
}

export async function getConfirmation(): Promise<boolean> {
    return await NiceModal.show(CONFIRMATION_DIALOG, {
        id: CONFIRMATION_DIALOG,
        caption: i18n('context_unsaved-changes-warning'),
        textButtonApply: i18n('action_apply'),
        propsButtonApply: {view: 'l'},
        renderButtons: (buttonApply: React.ReactNode, buttonCancel: React.ReactNode) => {
            return (
                <React.Fragment>
                    {buttonCancel}
                    <ExtendedSaveQueryButton />
                    {buttonApply}
                </React.Fragment>
            );
        },
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
    const userInput = useTypedSelector(selectUserInput);
    const callbackWithConfirmation = React.useMemo(
        () => changeInputWithConfirmation<T>(callback),
        [callback],
    );
    if (!userInput) {
        return callback;
    }
    return callbackWithConfirmation;
}
