import {FormEvent, useState} from 'react';
import cn from 'bem-cn-lite';
import {Dialog} from '@gravity-ui/uikit';

import {Icon} from '../Icon';

import './CriticalActionDialog.scss';

const b = cn('ydb-critical-dialog');

interface CriticalActionDialogProps {
    visible: boolean;
    text: string;
    onClose: VoidFunction;
    onConfirm: () => Promise<unknown>;
    onConfirmActionFinish: VoidFunction;
}

export const CriticalActionDialog = ({
    visible,
    text,
    onClose,
    onConfirm,
    onConfirmActionFinish,
}: CriticalActionDialogProps) => {
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        return onConfirm().then(() => {
            onConfirmActionFinish();
            setIsLoading(false);
            onClose();
        });
    };

    return (
        <Dialog open={visible} hasCloseButton={false} className={b()} size="s" onClose={onClose}>
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
                    textButtonApply="Confirm"
                    textButtonCancel="Cancel"
                    propsButtonApply={{type: 'submit'}}
                    onClickButtonCancel={onClose}
                    onClickButtonApply={() => {}}
                />
            </form>
        </Dialog>
    );
};
