import {useState} from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';
import {Dialog} from '@yandex-cloud/uikit';
import Icon from '../Icon/Icon';

import './CriticalActionDialog.scss';

const b = cn('km-critical-dialog');

export default function CriticalActionDialog({visible, onClose, onConfirm, text}) {
    const [progress, setProgress] = useState(false);

    const onSubmit = (e) => {
        e.preventDefault();
        setProgress(true);

        return onConfirm().then(() => {
            setProgress(false);
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
                    progress={progress}
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
}

CriticalActionDialog.propTypes = {
    visible: PropTypes.bool,
    onClose: PropTypes.func,
    onConfirm: PropTypes.func,
    text: PropTypes.string,
};
