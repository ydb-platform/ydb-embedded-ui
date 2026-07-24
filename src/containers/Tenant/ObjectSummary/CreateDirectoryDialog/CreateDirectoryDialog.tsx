import React from 'react';

import {DatabaseFill, FolderFill} from '@gravity-ui/icons';
import {Breadcrumbs, Dialog, TextInput} from '@gravity-ui/uikit';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {useClusterWithProxy} from '../../../../store/reducers/cluster/cluster';
import {schemaApi} from '../../../../store/reducers/schema/schema';
import {cn} from '../../../../utils/cn';
import i18n from '../../i18n';
import {transformPath} from '../transformPath';

import './CreateDirectoryDialog.scss';

const b = cn('ydb-schema-create-directory-dialog');

const relativePathInputId = 'relativePath';

interface CreateDirectoryDialogProps {
    open: boolean;
    onClose: VoidFunction;
    database: string;
    databaseFullPath: string;
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

export function CreateDirectoryDialog({
    open,
    onClose,
    database,
    databaseFullPath,
    parentPath,
    onSuccess,
}: CreateDirectoryDialogProps) {
    const useMetaProxy = useClusterWithProxy();
    const [validationError, setValidationError] = React.useState('');
    const [relativePath, setRelativePath] = React.useState('');
    const [create, response] = schemaApi.useCreateDirectoryMutation();
    const inputRef = React.useRef<HTMLInputElement>(null);

    const normalizedDatabasePath = databaseFullPath.replace(/^\/+|\/+$/g, '');
    const normalizedParentPath = parentPath.replace(/^\/+|\/+$/g, '');
    const relativeParentPath = transformPath(parentPath, databaseFullPath).replace(
        /^\/+|\/+$/g,
        '',
    );
    const isDatabaseRoot = normalizedParentPath === normalizedDatabasePath;

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
            database,
            databaseFullPath,
            path,
            useMetaProxy,
        })
            .unwrap()
            .then(() => {
                handleClose();
                onSuccess(relativePath);
            });
    };

    return (
        <Dialog open={open} onClose={handleClose} size="s" initialFocus={inputRef}>
            <Dialog.Header caption={i18n('schema.tree.dialog.header')} />
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    const nextValidationError = validateRelativePath(relativePath);
                    setValidationError(nextValidationError);
                    if (!nextValidationError) {
                        handleSubmit();
                    }
                }}
            >
                <Dialog.Body>
                    <div className={b('label')}>
                        <Breadcrumbs className={b('breadcrumbs')}>
                            <Breadcrumbs.Item disabled>
                                <span className={b('breadcrumb-content')}>
                                    <DatabaseFill className={b('breadcrumb-icon')} />
                                    <span>{normalizedDatabasePath}</span>
                                </span>
                            </Breadcrumbs.Item>
                            {!isDatabaseRoot && (
                                <Breadcrumbs.Item disabled>
                                    <span className={b('breadcrumb-content')}>
                                        <FolderFill className={b('breadcrumb-icon')} />
                                        <span className={b('directory-path')}>
                                            {relativeParentPath}
                                        </span>
                                    </span>
                                </Breadcrumbs.Item>
                            )}
                        </Breadcrumbs>
                    </div>
                    <TextInput
                        controlRef={inputRef}
                        placeholder={i18n('schema.tree.dialog.placeholder')}
                        aria-label={i18n('schema.tree.dialog.placeholder')}
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
