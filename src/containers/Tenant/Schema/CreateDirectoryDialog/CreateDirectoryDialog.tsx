import React from 'react';

import {Dialog, TextInput} from '@gravity-ui/uikit';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {schemaApi} from '../../../../store/reducers/schema/schema';
import {cn} from '../../../../utils/cn';
import i18n from '../../i18n';

import './CreateDirectoryDialog.scss';

const b = cn('ydb-schema-create-directory-dialog');

const relativePathInputId = 'relativePath';

interface SchemaTreeProps {
    open: boolean;
    onClose: VoidFunction;
    parentPath: string;
    onSuccess: (value: string) => void;
}

function validateRelativePath(value: string) {
    if (!value) {
        return i18n('schema.tree.dialog.empty');
    }
    if (/\s/.test(value)) {
        return i18n('schema.tree.dialog.whitespace');
    }
    return '';
}

export function CreateDirectoryDialog({open, onClose, parentPath, onSuccess}: SchemaTreeProps) {
    const [validationError, setValidationError] = React.useState('');
    const [relativePath, setRelativePath] = React.useState('');
    const [create, response] = schemaApi.useCreateDirectoryMutation();

    const resetErrors = () => {
        setValidationError('');
        response.reset();
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

    const handleSubmit = () => {
        const path = `${parentPath}/${relativePath}`;
        create({
            database: parentPath,
            path,
        })
            .unwrap()
            .then(() => {
                handleClose();
                onSuccess(relativePath);
            });
    };

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
                    <label htmlFor={relativePathInputId} className={b('label')}>
                        <span className={b('description')}>
                            {i18n('schema.tree.dialog.description')}
                        </span>
                        {`${parentPath}/`}
                    </label>
                    <div className={b('input-wrapper')}>
                        <TextInput
                            placeholder={i18n('schema.tree.dialog.placeholder')}
                            value={relativePath}
                            onUpdate={handleUpdate}
                            autoFocus
                            hasClear
                            autoComplete={false}
                            disabled={response.isLoading}
                            validationState={validationError ? 'invalid' : undefined}
                            id={relativePathInputId}
                            errorMessage={validationError}
                        />
                    </div>
                    {response.isError && (
                        <ResponseError
                            error={response.error}
                            defaultMessage={i18n('schema.tree.dialog.invalid')}
                        />
                    )}
                </Dialog.Body>
                <Dialog.Footer
                    loading={response.isLoading}
                    textButtonApply={i18n('schema.tree.dialog.buttonApply')}
                    textButtonCancel={i18n('schema.tree.dialog.buttonCancel')}
                    onClickButtonCancel={handleClose}
                    propsButtonApply={{type: 'submit'}}
                />
            </form>
        </Dialog>
    );
}
