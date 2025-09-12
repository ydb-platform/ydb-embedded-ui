import React from 'react';

import NiceModal from '@ebay/nice-modal-react';
import {Dialog, Text, TextInput} from '@gravity-ui/uikit';

import {schemaAclApi} from '../../../../../store/reducers/schemaAcl/schemaAcl';
import createToast from '../../../../../utils/createToast';
import {useAclSyntax} from '../../../../../utils/hooks';
import {prepareErrorMessage} from '../../../../../utils/prepareErrorMessage';
import i18n from '../i18n';
import {block} from '../shared';

const CHANGE_OWNER_DIALOG = 'change-owner-dialog';

interface GetChangeOwnerDialogProps {
    path: string;
    database: string;
    databaseFullPath: string;
}

export async function getChangeOwnerDialog({
    path,
    database,
    databaseFullPath,
}: GetChangeOwnerDialogProps): Promise<boolean> {
    return await NiceModal.show(CHANGE_OWNER_DIALOG, {
        id: CHANGE_OWNER_DIALOG,
        path,
        database,
        databaseFullPath,
    });
}

const ChangeOwnerDialogNiceModal = NiceModal.create(
    ({path, database, databaseFullPath}: GetChangeOwnerDialogProps) => {
        const modal = NiceModal.useModal();

        const handleClose = () => {
            modal.hide();
            modal.remove();
        };

        return (
            <ChangeOwnerDialog
                onClose={() => {
                    modal.resolve(false);
                    handleClose();
                }}
                open={modal.visible}
                path={path}
                database={database}
                databaseFullPath={databaseFullPath}
            />
        );
    },
);

NiceModal.register(CHANGE_OWNER_DIALOG, ChangeOwnerDialogNiceModal);

interface ChangeOwnerDialogProps extends GetChangeOwnerDialogProps {
    open: boolean;
    onClose: () => void;
}

function ChangeOwnerDialog({
    open,
    onClose,
    path,
    database,
    databaseFullPath,
}: ChangeOwnerDialogProps) {
    const [newOwner, setNewOwner] = React.useState('');
    const [requestErrorMessage, setRequestErrorMessage] = React.useState('');
    const [updateOwner, updateOwnerResponse] = schemaAclApi.useUpdateAccessMutation();
    const dialect = useAclSyntax();

    const handleTyping = (value: string) => {
        setNewOwner(value);
        setRequestErrorMessage('');
    };
    const onApply = () => {
        updateOwner({
            path,
            database,
            databaseFullPath,
            dialect,
            rights: {ChangeOwnership: {Subject: newOwner}},
        })
            .unwrap()
            .then(() => {
                onClose();
                createToast({
                    name: 'updateOwner',
                    content: i18n('title_owner-changed'),
                    autoHiding: 3000,
                });
            })
            .catch((error) => {
                setRequestErrorMessage(prepareErrorMessage(error));
            });
    };
    return (
        <Dialog open={open} size="s" onClose={onClose} onEnterKeyDown={onApply}>
            <Dialog.Header caption={i18n('action_change-owner')} />
            <Dialog.Body>
                <div className={block('dialog-content-wrapper')}>
                    <TextInput
                        id="queryName"
                        placeholder={i18n('decription_enter-subject')}
                        value={newOwner}
                        onUpdate={handleTyping}
                        hasClear
                        autoFocus
                        autoComplete={false}
                    />
                    {requestErrorMessage && (
                        <Text
                            color="danger"
                            className={block('dialog-error')}
                            title={requestErrorMessage}
                        >
                            {requestErrorMessage}
                        </Text>
                    )}
                </div>
            </Dialog.Body>
            <Dialog.Footer
                onClickButtonApply={onApply}
                textButtonCancel={i18n('action_cancel')}
                textButtonApply={i18n('action_apply')}
                onClickButtonCancel={onClose}
                propsButtonApply={{
                    loading: updateOwnerResponse.isLoading,
                    disabled: !newOwner.length,
                }}
            />
        </Dialog>
    );
}
