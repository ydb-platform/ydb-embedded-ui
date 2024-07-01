import React from 'react';

import {Dialog, TextInput} from '@gravity-ui/uikit';

import {cn} from '../../../../utils/cn';
import i18n from '../../i18n';

import './CreateDirectoryDialog.scss';
const b = cn('ydb-schema-create-directory-dialog');

interface SchemaTreeProps {
    open: boolean;
    parent: string;
    isLoading: boolean;
    onClose: () => void;
    onSubmit: (value: string) => void;
    onUpdate: (value: string) => void;
    error: string;
}

export function CreateDirectoryDialog(props: SchemaTreeProps) {
    const {open, parent, isLoading, onClose, onSubmit, onUpdate, error} = props;
    const [child, setChild] = React.useState('');

    const disabled = React.useMemo(() => {
        return Boolean(error) || /\s/.test(child);
    }, [error, child]);

    const handleClose = () => {
        onClose();
    };

    const handleSubmit = () => {
        if (!disabled) {
            onSubmit(child);
        }
    };

    const handleUpdate = (value: string) => {
        setChild(value);
    };

    React.useEffect(() => {
        if (!open) {
            setChild('');
        }
    }, [open]);

    React.useEffect(() => {
        onUpdate(child);
    }, [onUpdate, child]);

    return (
        <Dialog open={open} onClose={handleClose} onEnterKeyDown={handleSubmit}>
            <Dialog.Header caption={i18n('schema.tree.dialog.header')} />
            <Dialog.Body className={b('modal')}>
                <div className={b('label')}>
                    <div className={b('description')}>{i18n('schema.tree.dialog.description')}</div>
                    <div>{`${parent}/`}</div>
                </div>
                <TextInput
                    placeholder={i18n('schema.tree.dialog.placeholder')}
                    value={child}
                    onUpdate={handleUpdate}
                    autoFocus
                    hasClear
                    disabled={isLoading}
                    validationState={disabled ? 'invalid' : undefined}
                />
                {error && <div className={b('error')}>{error}</div>}
            </Dialog.Body>
            <Dialog.Footer
                loading={isLoading}
                textButtonApply={i18n('schema.tree.dialog.buttonApply')}
                textButtonCancel={i18n('schema.tree.dialog.buttonCancel')}
                onClickButtonCancel={handleClose}
                onClickButtonApply={handleSubmit}
                propsButtonApply={{disabled}}
            />
        </Dialog>
    );
}
