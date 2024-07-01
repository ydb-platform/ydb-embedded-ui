import React from 'react';

import {Dialog, TextInput} from '@gravity-ui/uikit';

import {schemaApi} from '../../../../store/reducers/schema/schema';
import type {IResponseError} from '../../../../types/api/error';
import {cn} from '../../../../utils/cn';
import i18n from '../../i18n';

import './CreateDirectoryDialog.scss';
const b = cn('ydb-schema-create-directory-dialog');

interface SchemaTreeProps {
    open: boolean;
    onOpen: (value: boolean) => void;
    parentPath: string;
    onSubmit: (value: string) => void;
}

export function CreateDirectoryDialog(props: SchemaTreeProps) {
    const [error, setError] = React.useState('');
    const [relativePath, setRelativePath] = React.useState('');
    const [create, response] = schemaApi.useCreateDirectoryMutation();

    const invalid = React.useMemo(() => {
        return /\s/.test(relativePath);
    }, [relativePath]);

    const disabled = React.useMemo(() => {
        return Boolean(error) || invalid;
    }, [error, invalid]);

    React.useEffect(() => {
        props.onOpen(props.open);
    }, [props]);

    const handleClose = () => {
        props.onOpen(false);
        setRelativePath('');
    };

    const handleSubmit = async () => {
        if (!disabled) {
            const path = `${props.parentPath}/${relativePath}`;
            try {
                await create({
                    database: props.parentPath,
                    path: `${props.parentPath}/${relativePath}`,
                }).unwrap();
                props.onOpen(false);
                props.onSubmit(path);
                setRelativePath('');
            } catch (e) {
                const errorMessage = (e as IResponseError<string>)?.data || ' Unknown error';
                setError(errorMessage);
            }
        }
    };

    const handleUpdate = (updated: string) => {
        setRelativePath(updated);
        setError('');
    };

    return (
        <Dialog open={props.open} onClose={handleClose} onEnterKeyDown={handleSubmit}>
            <Dialog.Header caption={i18n('schema.tree.dialog.header')} />
            <Dialog.Body className={b('modal')}>
                <div className={b('label')}>
                    <div className={b('description')}>{i18n('schema.tree.dialog.description')}</div>
                    <div>{`${props.parentPath}/`}</div>
                </div>
                <TextInput
                    placeholder={i18n('schema.tree.dialog.placeholder')}
                    value={relativePath}
                    onUpdate={handleUpdate}
                    autoFocus
                    hasClear
                    disabled={response.isLoading}
                    validationState={disabled ? 'invalid' : undefined}
                />
                {Boolean(error) && <div className={b('error')}>{error}</div>}
                {!error && invalid && (
                    <div className={b('invalid')}>{i18n('schema.tree.dialog.invalid')}</div>
                )}
            </Dialog.Body>
            <Dialog.Footer
                loading={response.isLoading}
                textButtonApply={i18n('schema.tree.dialog.buttonApply')}
                textButtonCancel={i18n('schema.tree.dialog.buttonCancel')}
                onClickButtonCancel={handleClose}
                onClickButtonApply={handleSubmit}
                propsButtonApply={{disabled}}
            />
        </Dialog>
    );
}
