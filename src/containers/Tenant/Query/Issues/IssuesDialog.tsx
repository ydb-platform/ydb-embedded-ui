import {Dialog} from '@gravity-ui/uikit';

import type {IssueMessage} from '../../../../types/api/query';

import {Issues} from './Issues';

interface IssuesDialogProps {
    open: boolean;
    issues: IssueMessage[];
    hideSeverity?: boolean;
    onClose: () => void;
    textButtonCancel?: string;
    size?: 's' | 'm' | 'l';
    caption?: string;
}

export function IssuesDialog({
    open,
    issues,
    hideSeverity,
    onClose,
    textButtonCancel = 'Close',
    size = 'm',
    caption,
}: IssuesDialogProps) {
    return (
        <Dialog size={size} onClose={onClose} disableOutsideClick open={open}>
            <Dialog.Header caption={caption} />
            <Dialog.Body>
                <Issues issues={issues} hideSeverity={hideSeverity} />
            </Dialog.Body>
            <Dialog.Footer textButtonCancel={textButtonCancel} onClickButtonCancel={onClose} />
        </Dialog>
    );
}
