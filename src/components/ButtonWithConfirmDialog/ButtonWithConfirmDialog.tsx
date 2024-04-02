import React from 'react';

import {Button} from '@gravity-ui/uikit';
import type {ButtonProps} from '@gravity-ui/uikit';

import {CriticalActionDialog} from '../CriticalActionDialog';

interface ButtonWithConfirmDialogProps<T, K> {
    children: React.ReactNode;
    onConfirmAction: () => Promise<T>;
    onConfirmActionSuccess?: (() => Promise<K>) | VoidFunction;
    dialogContent: string;
    buttonDisabled?: ButtonProps['disabled'];
    buttonView?: ButtonProps['view'];
    buttonClassName?: ButtonProps['className'];
}

export function ButtonWithConfirmDialog<T, K>({
    children,
    onConfirmAction,
    onConfirmActionSuccess,
    dialogContent,
    buttonDisabled = false,
    buttonView = 'action',
    buttonClassName,
}: ButtonWithConfirmDialogProps<T, K>) {
    const [isConfirmDialogVisible, setIsConfirmDialogVisible] = React.useState(false);
    const [buttonLoading, setButtonLoading] = React.useState(false);

    const handleConfirmAction = async () => {
        setButtonLoading(true);
        await onConfirmAction();
        setButtonLoading(false);
    };

    const handleConfirmActionSuccess = async () => {
        if (onConfirmActionSuccess) {
            setButtonLoading(true);

            try {
                await onConfirmActionSuccess();
            } catch {
            } finally {
                setButtonLoading(false);
            }
        }
    };

    const handleConfirmActionError = () => {
        setButtonLoading(false);
    };

    return (
        <React.Fragment>
            <CriticalActionDialog
                visible={isConfirmDialogVisible}
                text={dialogContent}
                onConfirm={handleConfirmAction}
                onConfirmActionSuccess={handleConfirmActionSuccess}
                onConfirmActionError={handleConfirmActionError}
                onClose={() => {
                    setIsConfirmDialogVisible(false);
                }}
            />
            <Button
                onClick={() => setIsConfirmDialogVisible(true)}
                view={buttonView}
                disabled={buttonDisabled}
                loading={!buttonDisabled && buttonLoading}
                className={buttonClassName}
            >
                {children}
            </Button>
        </React.Fragment>
    );
}
