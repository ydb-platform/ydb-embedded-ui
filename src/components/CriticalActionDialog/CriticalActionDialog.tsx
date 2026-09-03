import React from 'react';

import {Alert, Checkbox, Dialog, Flex, Text} from '@gravity-ui/uikit';
import type {ButtonView} from '@gravity-ui/uikit';

import {ResultIssues} from '../../containers/Tenant/Query/Issues/Issues';
import type {IResponseError} from '../../types/api/error';
import {cn} from '../../utils/cn';
import {BRAND_BUTTON_CLASS} from '../../utils/constants';
import {isResponseError, isResponseErrorWithIssues} from '../../utils/response';

import {criticalActionDialogKeyset} from './i18n';

import './CriticalActionDialog.scss';

const b = cn('ydb-critical-dialog');

const parseError = (error: unknown) => {
    if (isResponseError(error)) {
        if (error.status === 403) {
            return criticalActionDialogKeyset('no-rights-error');
        }
        if (typeof error.data === 'string') {
            return error.data;
        }
        if (isResponseErrorWithIssues(error) && error.data) {
            return <ResultIssues hideSeverity data={error.data} />;
        }
        if (error.statusText) {
            return error.statusText;
        }
    }

    return criticalActionDialogKeyset('default-error');
};

interface CriticalActionDialogProps<T> {
    visible: boolean;
    header?: React.ReactNode;
    description?: string;
    warningText?: string;
    withRetry?: boolean;
    retryButtonText?: string;
    applyButtonText?: string;
    applyButtonView?: ButtonView;
    withCheckBox?: boolean;
    onClose: VoidFunction;
    onConfirm: (isRetry?: boolean) => Promise<T>;
    onConfirmActionSuccess: VoidFunction;
    onConfirmActionError: (error: unknown) => void;
}

export function CriticalActionDialog<T>({
    visible,
    header,
    description,
    warningText,
    withRetry,
    retryButtonText,
    applyButtonText = criticalActionDialogKeyset('button-confirm'),
    applyButtonView,
    withCheckBox,
    onClose,
    onConfirm,
    onConfirmActionSuccess,
    onConfirmActionError,
}: CriticalActionDialogProps<T>) {
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<IResponseError>();
    const [checkBoxChecked, setCheckBoxChecked] = React.useState<boolean>(false);

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
        setCheckBoxChecked(false);
    };

    const renderCheckBox = () => {
        if (withCheckBox) {
            return (
                <Checkbox checked={checkBoxChecked} onUpdate={setCheckBoxChecked}>
                    {criticalActionDialogKeyset('checkbox-text')}
                </Checkbox>
            );
        }

        return null;
    };

    const renderDialogContent = () => {
        const isRetry = Boolean(error && withRetry);
        let currentApplyButtonText: string | undefined = applyButtonText;

        if (error) {
            currentApplyButtonText = isRetry
                ? retryButtonText || criticalActionDialogKeyset('button-retry')
                : undefined;
        }

        return (
            <React.Fragment>
                <Dialog.Header caption={header} />

                <Dialog.Body>
                    <Flex direction="column" gap={4}>
                        {description && <Text as="div">{description}</Text>}
                        {warningText && <Alert theme="warning" message={warningText} />}
                        {error && <Alert theme="danger" message={parseError(error)} />}
                        {renderCheckBox()}
                    </Flex>
                </Dialog.Body>

                <Dialog.Footer
                    loading={isLoading}
                    preset="default"
                    textButtonApply={currentApplyButtonText}
                    textButtonCancel={criticalActionDialogKeyset('button-cancel')}
                    propsButtonApply={{
                        type: 'submit',
                        disabled: withCheckBox && !checkBoxChecked,
                        view: applyButtonView,
                        className: applyButtonView === 'action' ? BRAND_BUTTON_CLASS : undefined,
                    }}
                    onClickButtonCancel={onClose}
                    onClickButtonApply={() => onApply(isRetry ? true : undefined)}
                />
            </React.Fragment>
        );
    };

    return (
        <Dialog
            open={visible}
            hasCloseButton
            className={b()}
            size="s"
            onClose={onClose}
            onTransitionOutComplete={handleTransitionExited}
        >
            {renderDialogContent()}
        </Dialog>
    );
}
