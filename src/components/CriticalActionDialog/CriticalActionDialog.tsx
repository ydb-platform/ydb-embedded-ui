import {FormEvent, useState} from 'react';
import cn from 'bem-cn-lite';
import {Dialog} from '@gravity-ui/uikit';
import {CircleXmarkFill} from '@gravity-ui/icons';

import type {IResponseError} from '../../types/api/error';
import {Icon} from '../Icon';
import {criticalActionDialogKeyset} from './i18n';

import './CriticalActionDialog.scss';

const b = cn('ydb-critical-dialog');

const parseError = (error: IResponseError) => {
    if (error.status === 403) {
        return criticalActionDialogKeyset('no-rights-error');
    }
    if (error.statusText) {
        return error.statusText;
    }

    return criticalActionDialogKeyset('default-error');
};

interface CriticalActionDialogProps<T> {
    visible: boolean;
    text: string;
    onClose: VoidFunction;
    onConfirm: () => Promise<T>;
    onConfirmActionSuccess: VoidFunction;
    onConfirmActionError: VoidFunction;
}

export function CriticalActionDialog<T>({
    visible,
    text,
    onClose,
    onConfirm,
    onConfirmActionSuccess,
    onConfirmActionError,
}: CriticalActionDialogProps<T>) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<IResponseError>();

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        return onConfirm()
            .then(() => {
                onConfirmActionSuccess();
                onClose();
            })
            .catch((err) => {
                onConfirmActionError();
                setError(err);
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const renderDialogContent = () => {
        if (error) {
            return (
                <>
                    <Dialog.Body className={b('body')}>
                        <span className={b('error-icon')}>
                            <CircleXmarkFill width="24" height="22" />
                        </span>
                        {parseError(error)}
                    </Dialog.Body>

                    <Dialog.Footer
                        loading={false}
                        preset="default"
                        textButtonCancel={criticalActionDialogKeyset('button-close')}
                        onClickButtonCancel={onClose}
                    />
                </>
            );
        }

        return (
            <form onSubmit={onSubmit}>
                <Dialog.Body className={b('body')}>
                    <span className={b('warning-icon')}>
                        <Icon name="dialog-warning" width="24" height="22" viewBox="0 0 24 22" />
                    </span>
                    {text}
                </Dialog.Body>

                <Dialog.Footer
                    loading={isLoading}
                    preset="default"
                    textButtonApply={criticalActionDialogKeyset('button-confirm')}
                    textButtonCancel={criticalActionDialogKeyset('button-cancel')}
                    propsButtonApply={{type: 'submit'}}
                    onClickButtonCancel={onClose}
                    onClickButtonApply={() => {}}
                />
            </form>
        );
    };

    return (
        <Dialog
            open={visible}
            hasCloseButton={false}
            className={b()}
            size="s"
            onClose={onClose}
            onTransitionExited={() => setError(undefined)}
        >
            {renderDialogContent()}
        </Dialog>
    );
}
