import React from 'react';

import NiceModal from '@ebay/nice-modal-react';
import {Dialog, TextInput} from '@gravity-ui/uikit';

import {cn} from '../../../../../utils/cn';
import {BRAND_BUTTON_CLASS} from '../../../../../utils/constants';
import i18n from '../../i18n';
import {getQueryNameValidationError} from '../../utils/QueryNameValidation';

import './RenameQueryDialog.scss';

export const RENAME_QUERY_DIALOG = 'rename-query-dialog';

const b = cn('ydb-rename-query-dialog');

export interface RenameQueryDialogNiceModalProps {
    title: string;
    onRename: (title: string) => void;
    onClose?: VoidFunction;
}

function RenameQueryDialog({
    open,
    title,
    onRename,
    onClose,
}: RenameQueryDialogNiceModalProps & {open: boolean; onClose: VoidFunction}) {
    const [nextTitle, setNextTitle] = React.useState(title);
    const [errorMessage, setErrorMessage] = React.useState<string>();

    const handleClose = React.useCallback(() => {
        onClose();
    }, [onClose]);

    const handleTitleChange = React.useCallback((value: string) => {
        setNextTitle(value);
        setErrorMessage(undefined);
    }, []);

    const handleApply = React.useCallback(() => {
        const normalizedTitle = nextTitle.trim();
        const validationError = getQueryNameValidationError(normalizedTitle);

        if (validationError) {
            setErrorMessage(i18n('alert_query-name-empty'));
            return;
        }

        onRename(normalizedTitle);
        handleClose();
    }, [handleClose, nextTitle, onRename]);

    const controlRef = React.useRef<null | HTMLInputElement>(null);

    return (
        <Dialog
            open={open}
            hasCloseButton={true}
            size="s"
            onClose={handleClose}
            onEnterKeyDown={handleApply}
            initialFocus={controlRef}
            className={b()}
        >
            <Dialog.Header caption={i18n('title_rename-query')} />
            <Dialog.Body>
                <div className={b('dialog-row')}>{i18n('context_rename-query')}</div>
                <div className={b('dialog-row')}>
                    <div className={b('control-wrapper')}>
                        <TextInput
                            value={nextTitle}
                            onUpdate={handleTitleChange}
                            placeholder={i18n('field_query-name')}
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
                onClickButtonApply={handleApply}
                onClickButtonCancel={handleClose}
                propsButtonApply={{className: BRAND_BUTTON_CLASS}}
            />
        </Dialog>
    );
}

export const RenameQueryDialogNiceModal = NiceModal.create(
    (props: RenameQueryDialogNiceModalProps) => {
        const modal = NiceModal.useModal();

        const handleClose = React.useCallback(() => {
            props.onClose?.();
            modal.hide();
            modal.remove();
        }, [modal, props]);

        return <RenameQueryDialog {...props} open={modal.visible} onClose={handleClose} />;
    },
);

NiceModal.register(RENAME_QUERY_DIALOG, RenameQueryDialogNiceModal);
