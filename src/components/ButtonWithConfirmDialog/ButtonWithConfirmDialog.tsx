import React from 'react';

import {Button, Popover} from '@gravity-ui/uikit';
import type {ButtonProps, PopoverProps} from '@gravity-ui/uikit';

import {CriticalActionDialog} from '../CriticalActionDialog';

interface ButtonWithConfirmDialogProps<T, K> {
    children: React.ReactNode;
    onConfirmAction: (isRetry?: boolean) => Promise<T>;
    onConfirmActionSuccess?: (() => Promise<K>) | VoidFunction;
    dialogContent: string;
    retryButtonText?: string;
    buttonDisabled?: ButtonProps['disabled'];
    buttonView?: ButtonProps['view'];
    buttonClassName?: ButtonProps['className'];
    withPopover?: boolean;
    popoverContent?: PopoverProps['content'];
    popoverPlacement?: PopoverProps['placement'];
    popoverDisabled?: PopoverProps['disabled'];
}

export function ButtonWithConfirmDialog<T, K>({
    children,
    onConfirmAction,
    onConfirmActionSuccess,
    dialogContent,
    retryButtonText,
    buttonDisabled = false,
    buttonView = 'action',
    buttonClassName,
    withPopover = false,
    popoverContent,
    popoverPlacement = 'right',
    popoverDisabled = true,
}: ButtonWithConfirmDialogProps<T, K>) {
    const [isConfirmDialogVisible, setIsConfirmDialogVisible] = React.useState(false);
    const [buttonLoading, setButtonLoading] = React.useState(false);
    const [withRetry, setWithRetry] = React.useState(false);

    const handleConfirmAction = async (isRetry?: boolean) => {
        setButtonLoading(true);
        await onConfirmAction(isRetry);
        setButtonLoading(false);
    };

    const handleConfirmActionSuccess = async () => {
        setWithRetry(false);

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

    const handleConfirmActionError = (error: unknown) => {
        const isWithRetry = Boolean(
            error && typeof error === 'object' && 'retryPossible' in error && error.retryPossible,
        );
        setWithRetry(isWithRetry);
        setButtonLoading(false);
    };

    const renderButton = () => {
        return (
            <Button
                onClick={() => setIsConfirmDialogVisible(true)}
                view={buttonView}
                disabled={buttonDisabled}
                loading={!buttonDisabled && buttonLoading}
                className={buttonClassName}
            >
                {children}
            </Button>
        );
    };

    const renderContent = () => {
        if (withPopover) {
            return (
                <Popover
                    content={popoverContent}
                    placement={popoverPlacement}
                    disabled={popoverDisabled}
                >
                    {renderButton()}
                </Popover>
            );
        }

        return renderButton();
    };

    return (
        <React.Fragment>
            <CriticalActionDialog
                visible={isConfirmDialogVisible}
                text={dialogContent}
                withRetry={withRetry}
                retryButtonText={retryButtonText}
                onConfirm={handleConfirmAction}
                onConfirmActionSuccess={handleConfirmActionSuccess}
                onConfirmActionError={handleConfirmActionError}
                onClose={() => {
                    setIsConfirmDialogVisible(false);
                }}
            />
            {renderContent()}
        </React.Fragment>
    );
}
