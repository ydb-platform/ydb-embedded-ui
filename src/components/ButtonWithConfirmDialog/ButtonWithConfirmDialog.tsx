import React from 'react';

import {Button, Popover} from '@gravity-ui/uikit';
import type {ButtonProps, PopoverProps} from '@gravity-ui/uikit';

import {CriticalActionDialog} from '../CriticalActionDialog/CriticalActionDialog';
import {isErrorWithRetry} from '../CriticalActionDialog/utils';

interface ButtonWithConfirmDialogProps<T, K> {
    children: React.ReactNode;
    onConfirmAction: (isRetry?: boolean) => Promise<T>;
    onConfirmActionSuccess?: (() => Promise<K>) | VoidFunction;
    dialogHeader: string;
    dialogText: string;
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
    dialogHeader,
    dialogText,
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
    };

    const handleConfirmActionSuccess = async () => {
        setWithRetry(false);

        try {
            await onConfirmActionSuccess?.();
        } finally {
            setButtonLoading(false);
        }
    };

    const handleConfirmActionError = (error: unknown) => {
        setWithRetry(isErrorWithRetry(error));
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
                    <span>{renderButton()}</span>
                </Popover>
            );
        }

        return renderButton();
    };

    return (
        <React.Fragment>
            <CriticalActionDialog
                visible={isConfirmDialogVisible}
                header={dialogHeader}
                text={dialogText}
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
