import React from 'react';

import {Dialog, TextInput} from '@gravity-ui/uikit';

import {cn} from '../../../../utils/cn';
import {BRAND_BUTTON_CLASS} from '../../../../utils/constants';
import i18n from '../i18n';
import {getQueryNameValidationError} from '../utils/QueryNameValidation';
import type {RenameSavedQueryStatus} from '../utils/savedQueries';

import './RenameSavedQueryDialog.scss';

const b = cn('ydb-rename-saved-query-dialog');

interface RenameSavedQueryDialogProps {
    currentName: string;
    open: boolean;
    onClose: VoidFunction;
    onRename: (nextName: string) => RenameSavedQueryStatus;
}

export function RenameSavedQueryDialog({
    currentName,
    open,
    onClose,
    onRename,
}: RenameSavedQueryDialogProps) {
    const [nextName, setNextName] = React.useState(currentName);
    const [errorMessage, setErrorMessage] = React.useState<string>();
    const controlRef = React.useRef<HTMLInputElement>(null);

    const handleNameChange = React.useCallback((value: string) => {
        setNextName(value);
        setErrorMessage(undefined);
    }, []);

    const handleApply = React.useCallback(() => {
        const trimmedName = nextName.trim();
        const validationError = getQueryNameValidationError(trimmedName);

        if (validationError) {
            setErrorMessage(i18n('alert_query-name-empty'));
            return;
        }

        const result = onRename(trimmedName);
        if (result === 'duplicate') {
            setErrorMessage(i18n('alert_saved-query-name-exists'));
            return;
        }
        if (result === 'not-found') {
            setErrorMessage(i18n('alert_saved-query-not-found'));
            return;
        }

        onClose();
    }, [nextName, onClose, onRename]);

    const handleSubmit = React.useCallback(
        (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            handleApply();
        },
        [handleApply],
    );

    return (
        <Dialog
            open={open}
            hasCloseButton={true}
            size="s"
            onClose={onClose}
            initialFocus={controlRef}
            className={b()}
        >
            <Dialog.Header caption={i18n('title_rename-query')} />
            <form onSubmit={handleSubmit}>
                <Dialog.Body>
                    <div className={b('dialog-row')}>{i18n('context_rename-query')}</div>
                    <div className={b('dialog-row')}>
                        <div className={b('control-wrapper')}>
                            <TextInput
                                value={nextName}
                                onUpdate={handleNameChange}
                                placeholder={i18n('field_query-name')}
                                aria-label={i18n('field_query-name')}
                                controlRef={controlRef}
                                hasClear
                                autoComplete={false}
                                validationState={errorMessage ? 'invalid' : undefined}
                                errorMessage={errorMessage}
                            />
                        </div>
                    </div>
                </Dialog.Body>
                <Dialog.Footer
                    textButtonApply={i18n('action_apply')}
                    textButtonCancel={i18n('action_cancel')}
                    onClickButtonCancel={onClose}
                    propsButtonApply={{type: 'submit', className: BRAND_BUTTON_CLASS}}
                />
            </form>
        </Dialog>
    );
}
