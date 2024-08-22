import React from 'react';

import {ChevronDown} from '@gravity-ui/icons';
import type {DropdownMenuItem, DropdownMenuProps} from '@gravity-ui/uikit';
import {Button, DropdownMenu, Icon, Popover} from '@gravity-ui/uikit';

import {CriticalActionDialog} from '../../../components/CriticalActionDialog/CriticalActionDialog';
import {isErrorWithRetry} from '../../../components/CriticalActionDialog/utils';
import type {EDecommitStatus} from '../../../types/api/pdisk';
import {wait} from '../../../utils';
import {cn} from '../../../utils/cn';
import {pDiskPageKeyset} from '../i18n';

import decommissionIcon from '../../../assets/icons/decommission.svg';

import './DecommissionButton.scss';

const b = cn('ydb-pdisk-decommission-button');

function getDecommissionWarningText(decommission?: EDecommitStatus) {
    if (decommission === 'DECOMMIT_IMMINENT') {
        return pDiskPageKeyset('decommission-dialog-imminent-warning');
    }
    if (decommission === 'DECOMMIT_PENDING') {
        return pDiskPageKeyset('decommission-dialog-pending-warning');
    }
    if (decommission === 'DECOMMIT_REJECTED') {
        return pDiskPageKeyset('decommission-dialog-rejected-warning');
    }
    if (decommission === 'DECOMMIT_NONE') {
        return pDiskPageKeyset('decommission-dialog-none-warning');
    }

    return undefined;
}

interface DecommissionButtonProps {
    decommission?: EDecommitStatus;
    onConfirmAction: (newDecomissionStatus?: EDecommitStatus, isRetry?: boolean) => Promise<void>;
    onConfirmActionSuccess: (() => Promise<void>) | VoidFunction;
    buttonDisabled?: boolean;
    popoverDisabled?: boolean;
}

export function DecommissionButton({
    decommission,
    onConfirmAction,
    onConfirmActionSuccess,
    buttonDisabled,
    popoverDisabled,
}: DecommissionButtonProps) {
    const [newDecommission, setNewDecommission] = React.useState<EDecommitStatus | undefined>();
    const [buttonLoading, setButtonLoading] = React.useState(false);
    const [withRetry, setWithRetry] = React.useState(false);

    const handleConfirmAction = async (isRetry?: boolean) => {
        setButtonLoading(true);
        await onConfirmAction(newDecommission, isRetry);
        setButtonLoading(false);
    };

    const handleConfirmActionSuccess = async () => {
        setWithRetry(false);

        if (onConfirmActionSuccess) {
            setButtonLoading(true);

            // Decommission needs some time to change
            // Wait for some time to send request for updated data
            await wait(5000);

            try {
                await onConfirmActionSuccess();
            } catch {
            } finally {
                setButtonLoading(false);
            }
        }
    };

    const handleConfirmActionError = (error: unknown) => {
        setWithRetry(isErrorWithRetry(error));
        setButtonLoading(false);
    };

    const items: DropdownMenuItem[] = [
        {
            text: pDiskPageKeyset('decommission-none'),
            action: () => setNewDecommission('DECOMMIT_NONE'),
            hidden:
                !decommission ||
                decommission === 'DECOMMIT_NONE' ||
                decommission === 'DECOMMIT_UNSET',
        },
        {
            text: pDiskPageKeyset('decommission-pending'),
            action: () => setNewDecommission('DECOMMIT_PENDING'),
            hidden: decommission === 'DECOMMIT_PENDING',
        },
        {
            text: pDiskPageKeyset('decommission-rejected'),
            action: () => setNewDecommission('DECOMMIT_REJECTED'),
            hidden: decommission === 'DECOMMIT_REJECTED',
        },
        {
            text: pDiskPageKeyset('decommission-imminent'),
            theme: 'danger',
            action: () => setNewDecommission('DECOMMIT_IMMINENT'),
            hidden: decommission === 'DECOMMIT_IMMINENT',
        },
    ];

    const renderSwitcher: DropdownMenuProps<unknown>['renderSwitcher'] = (props) => {
        return (
            <Popover
                content={pDiskPageKeyset('decommission-change-not-allowed')}
                placement={'right'}
                disabled={popoverDisabled}
            >
                <Button
                    view={'normal'}
                    className={b('button')}
                    loading={buttonLoading}
                    disabled={buttonDisabled}
                    {...props}
                >
                    <Icon data={decommissionIcon} />
                    {pDiskPageKeyset('decommission-button')}
                    <Icon data={ChevronDown} />
                </Button>
            </Popover>
        );
    };

    return (
        <React.Fragment>
            <DropdownMenu
                renderSwitcher={renderSwitcher}
                items={items}
                popupProps={{className: b('popup')}}
            />
            <CriticalActionDialog
                visible={Boolean(newDecommission)}
                header={pDiskPageKeyset('decommission-dialog-title')}
                text={getDecommissionWarningText(newDecommission)}
                withRetry={withRetry}
                retryButtonText={pDiskPageKeyset('decommission-dialog-force-change')}
                onConfirm={handleConfirmAction}
                onConfirmActionSuccess={handleConfirmActionSuccess}
                onConfirmActionError={handleConfirmActionError}
                onClose={() => {
                    setNewDecommission(undefined);
                }}
            />
        </React.Fragment>
    );
}
