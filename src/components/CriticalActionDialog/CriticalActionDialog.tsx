import React from 'react';

import {CircleXmarkFill, TriangleExclamationFill} from '@gravity-ui/icons';
import {Dialog, Icon} from '@gravity-ui/uikit';

import type {IResponseError} from '../../types/api/error';
import {cn} from '../../utils/cn';

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
    header?: React.ReactNode;
    text?: string;
    withRetry?: boolean;
    retryButtonText?: string;
    onClose: VoidFunction;
    onConfirm: (isRetry?: boolean) => Promise<T>;
    onConfirmActionSuccess: VoidFunction;
    onConfirmActionError: (error: unknown) => void;
}

export function CriticalActionDialog<T>({
    visible,
    header,
    text,
    withRetry,
    retryButtonText,
    onClose,
    onConfirm,
    onConfirmActionSuccess,
    onConfirmActionError,
}: CriticalActionDialogProps<T>) {
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<IResponseError>();

    const onApply = async (isRetry?: boolean) => {
        setIsLoading(true);

        return onConfirm(isRetry)
            .then(() => {
                onConfirmActionSuccess();
                onClose();
            })
            .catch((err) => {
                onConfirmActionError(err);
                setError(err);
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const handleTransitionExited = () => {
        setError(undefined);
    };

    const renderDialogContent = () => {
        if (error) {
            return (
                <React.Fragment>
                    <Dialog.Header caption={header} />
                    <Dialog.Body className={b('body')}>
                        <div className={b('body-message', {error: true})}>
                            <span className={b('error-icon')}>
                                <CircleXmarkFill width="24" height="22" />
                            </span>
                            {parseError(error)}
                        </div>
                    </Dialog.Body>

                    <Dialog.Footer
                        loading={false}
                        preset="default"
                        textButtonApply={
                            withRetry
                                ? retryButtonText || criticalActionDialogKeyset('button-retry')
                                : undefined
                        }
                        textButtonCancel={criticalActionDialogKeyset('button-close')}
                        onClickButtonApply={() => onApply(true)}
                        onClickButtonCancel={onClose}
                    />
                </React.Fragment>
            );
        }

        return (
            <React.Fragment>
                <Dialog.Header caption={header} />

                <Dialog.Body className={b('body')}>
                    <div className={b('body-message', {warning: true})}>
                        <span className={b('warning-icon')}>
                            <Icon data={TriangleExclamationFill} size={24} />
                        </span>
                        {text}
                    </div>
                </Dialog.Body>

                <Dialog.Footer
                    loading={isLoading}
                    preset="default"
                    textButtonApply={criticalActionDialogKeyset('button-confirm')}
                    textButtonCancel={criticalActionDialogKeyset('button-cancel')}
                    propsButtonApply={{type: 'submit'}}
                    onClickButtonCancel={onClose}
                    onClickButtonApply={() => onApply()}
                />
            </React.Fragment>
        );
    };

    return (
        <Dialog
            open={visible}
            hasCloseButton={false}
            className={b()}
            size="s"
            onClose={onClose}
            onTransitionExited={handleTransitionExited}
        >
            {renderDialogContent()}
        </Dialog>
    );
}
