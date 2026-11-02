import React from 'react';

import {Button, Popover} from '@gravity-ui/uikit';
import type {ButtonProps, PopoverProps} from '@gravity-ui/uikit';

import {CriticalActionDialog} from '../CriticalActionDialog/CriticalActionDialog';
import {isErrorWithRetry} from '../CriticalActionDialog/utils';

interface ButtonWithConfirmDialogProps<T, K> {
    children: React.ReactNode;
    onConfirmAction: (isRetry?: boolean) => Promise<T>;
    onConfirmActionSuccess?:
        | ((isDialogOpen: boolean) => Promise<K>)
        | ((isDialogOpen: boolean) => void);
    onDialogOpen?: () => VoidFunction;
    dialogHeader: string;
    dialogText?: string;
    dialogWarning?: string;
    retryButtonText?: string;
    applyButtonText?: string;
    buttonDisabled?: ButtonProps['disabled'];
    buttonView?: ButtonProps['view'];
    applyButtonView?: ButtonProps['view'];
    buttonWidth?: ButtonProps['width'];
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
    onDialogOpen,
    dialogHeader,
    dialogText,
    dialogWarning,
    applyButtonText,
    retryButtonText,
    buttonDisabled = false,
    buttonView = 'action',
    buttonWidth,
    buttonClassName,
    withPopover = false,
    popoverContent,
    popoverPlacement = 'right',
    popoverDisabled = true,
    applyButtonView,
}: ButtonWithConfirmDialogProps<T, K>) {
    const [isConfirmDialogVisible, setIsConfirmDialogVisible] = React.useState(false);
    const [buttonLoading, setButtonLoading] = React.useState(false);
    const [withRetry, setWithRetry] = React.useState(false);
    const dialogInteraction = React.useRef<{open: boolean; release?: VoidFunction}>();
    const releaseDialog = React.useCallback(() => {
        const interaction = dialogInteraction.current;
        dialogInteraction.current = undefined;
        interaction?.release?.();
    }, []);

    React.useEffect(() => releaseDialog, [releaseDialog]);

    const handleConfirmAction = async (isRetry?: boolean) => {
        setButtonLoading(true);
        await onConfirmAction(isRetry);
    };

    const handleConfirmActionSuccess = async () => {
        setWithRetry(false);

        try {
            await onConfirmActionSuccess?.(dialogInteraction.current?.open ?? false);
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
                onClick={() => {
                    dialogInteraction.current = {open: true, release: onDialogOpen?.()};
                    setIsConfirmDialogVisible(true);
                }}
                view={buttonView}
                width={buttonWidth}
                disabled={buttonDisabled}
                loading={!buttonDisabled && buttonLoading}
                className={buttonClassName}
            >
                {children}
            </Button>
        );
    };

    // keep <span>: if button is disabled, popover won't open without this wrapper
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
                description={dialogText}
                warningText={dialogWarning}
                applyButtonText={applyButtonText}
                withRetry={withRetry}
                retryButtonText={retryButtonText}
                onConfirm={handleConfirmAction}
                applyButtonView={applyButtonView}
                onConfirmActionSuccess={handleConfirmActionSuccess}
                onConfirmActionError={handleConfirmActionError}
                onClose={() => {
                    if (dialogInteraction.current) {
                        dialogInteraction.current.open = false;
                    }
                    setIsConfirmDialogVisible(false);
                }}
                onTransitionOutComplete={releaseDialog}
            />
            {renderContent()}
        </React.Fragment>
    );
}
