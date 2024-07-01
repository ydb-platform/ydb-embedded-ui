import React from 'react';

import {Dialog, TextInput} from '@gravity-ui/uikit';

import {cn} from '../../../../utils/cn';
import i18n from '../../i18n';

import './CreateDirectoryDialog.scss';
const b = cn('ydb-schema-tree');

interface SchemaTreeProps {
    open: boolean;
    parent: string;
    onClose: () => void;
    onSubmit: (value: string) => void;
}

export function CreateDirectoryDialog(props: SchemaTreeProps) {
    const {open, parent, onClose, onSubmit} = props;
    const [child, setChild] = React.useState('');

    const handleClose = () => {
        setChild('');
        onClose();
    };
    const handleSubmit = () => {
        setChild('');
        onSubmit(child);
    };

    return (
        <Dialog open={open} onClose={handleClose}>
            <Dialog.Header caption={i18n('schema.tree.dialog.header')} />
            <Dialog.Body className={b('modal')}>
                <div className={b('label')}>
                    <div className={b('description')}>{i18n('schema.tree.dialog.description')}</div>
                    <div>{`${parent}/`}</div>
                </div>
                <TextInput
                    placeholder={i18n('schema.tree.dialog.placeholder')}
                    value={child}
                    onUpdate={setChild}
                />
            </Dialog.Body>
            <Dialog.Footer
                textButtonApply={i18n('schema.tree.dialog.buttonApply')}
                textButtonCancel={i18n('schema.tree.dialog.buttonCancel')}
                onClickButtonCancel={handleClose}
                onClickButtonApply={handleSubmit}
            />
        </Dialog>
    );
}
