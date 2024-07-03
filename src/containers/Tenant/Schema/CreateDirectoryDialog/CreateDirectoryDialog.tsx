import React from 'react';

import {Dialog, TextInput} from '@gravity-ui/uikit';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {schemaApi} from '../../../../store/reducers/schema/schema';
import {cn} from '../../../../utils/cn';
import i18n from '../../i18n';

import './CreateDirectoryDialog.scss';

const b = cn('ydb-schema-create-directory-dialog');

interface SchemaTreeProps {
    open: boolean;
    onClose: VoidFunction;
    parentPath: string;
    onSuccess: (value: string) => void;
}

function validateRelativePath(value: string) {
    if (value && /\s/.test(value)) {
        return i18n('schema.tree.dialog.whitespace');
    }
    return '';
}

export function CreateDirectoryDialog({open, onClose, parentPath, onSuccess}: SchemaTreeProps) {
    const [error, setError] = React.useState<unknown>('');
    const [validationError, setValidationError] = React.useState('');
    const [relativePath, setRelativePath] = React.useState('');
    const [create, response] = schemaApi.useCreateDirectoryMutation();

    const resetErrors = () => {
        setValidationError('');
        setError('');
    };

    const handleUpdate = (updated: string) => {
        setRelativePath(updated);
        resetErrors();
    };

    const handleClose = () => {
        onClose();
        setRelativePath('');
        resetErrors();
    };

    const handleSubmit = async () => {
        try {
            const path = `${parentPath}/${relativePath}`;
            await create({
                database: parentPath,
                path,
            }).unwrap();
            handleClose();
            onSuccess(relativePath);
        } catch (e) {
            setError(e);
        }
    };

    const hasError = Boolean(error);
    const hasValidationError = Boolean(validationError);

    return (
        <Dialog open={open} onClose={handleClose} size="s">
            <Dialog.Header caption={i18n('schema.tree.dialog.header')} />
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    const validationError = validateRelativePath(relativePath);
                    setValidationError(validationError);
                    if (!validationError) {
                        handleSubmit();
                    }
                }}
            >
                <Dialog.Body>
                    <div className={b('label')}>
                        <div className={b('description')}>
                            {i18n('schema.tree.dialog.description')}
                        </div>
                        <div>{`${parentPath}/`}</div>
                    </div>
                    <TextInput
                        placeholder={i18n('schema.tree.dialog.placeholder')}
                        value={relativePath}
                        onUpdate={handleUpdate}
                        autoFocus
                        hasClear
                        disabled={response.isLoading}
                        error={hasValidationError}
                    />
                    <div className={b('error-wrapper')}>
                        {hasValidationError && <ResponseError error={validationError} />}
                    </div>
                    {hasError && (
                        <ResponseError
                            error={error}
                            defaultMessage={i18n('schema.tree.dialog.invalid')}
                        />
                    )}
                </Dialog.Body>
                <Dialog.Footer
                    loading={response.isLoading}
                    textButtonApply={i18n('schema.tree.dialog.buttonApply')}
                    textButtonCancel={i18n('schema.tree.dialog.buttonCancel')}
                    onClickButtonCancel={handleClose}
                    propsButtonApply={{disabled: hasValidationError, type: 'submit'}}
                />
            </form>
        </Dialog>
    );
}
