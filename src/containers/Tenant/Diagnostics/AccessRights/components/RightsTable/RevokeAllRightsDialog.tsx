import React from 'react';

import NiceModal from '@ebay/nice-modal-react';
import {Dialog, Flex, Text} from '@gravity-ui/uikit';

import {SubjectWithAvatar} from '../../../../../../components/SubjectWithAvatar/SubjectWithAvatar';
import {useClusterWithProxy} from '../../../../../../store/reducers/cluster/cluster';
import {
    schemaAclApi,
    selectSubjectExplicitRights,
} from '../../../../../../store/reducers/schemaAcl/schemaAcl';
import createToast from '../../../../../../utils/createToast';
import {useAclSyntax, useTypedSelector} from '../../../../../../utils/hooks';
import {prepareErrorMessage} from '../../../../../../utils/prepareErrorMessage';
import i18n from '../../i18n';

const REVOKE_ALL_RIGHTS_DIALOG = 'revoke-all-rights-dialog';

interface GetRevokeAllRightsDialogProps {
    path: string;
    database: string;
    databaseFullPath: string;
    subject: string;
}

export async function getRevokeAllRightsDialog({
    path,
    database,
    subject,
    databaseFullPath,
}: GetRevokeAllRightsDialogProps): Promise<boolean> {
    return await NiceModal.show(REVOKE_ALL_RIGHTS_DIALOG, {
        id: REVOKE_ALL_RIGHTS_DIALOG,
        path,
        database,
        subject,
        databaseFullPath,
    });
}

const RevokeAllRightsDialogNiceModal = NiceModal.create(
    ({path, database, subject, databaseFullPath}: GetRevokeAllRightsDialogProps) => {
        const modal = NiceModal.useModal();

        const handleClose = () => {
            modal.hide();
            modal.remove();
        };

        return (
            <RevokeAllRightsDialog
                onClose={() => {
                    modal.resolve(false);
                    handleClose();
                }}
                open={modal.visible}
                path={path}
                database={database}
                subject={subject}
                databaseFullPath={databaseFullPath}
            />
        );
    },
);

NiceModal.register(REVOKE_ALL_RIGHTS_DIALOG, RevokeAllRightsDialogNiceModal);

interface RevokeAllRightsDialogProps extends GetRevokeAllRightsDialogProps {
    open: boolean;
    onClose: () => void;
}

function RevokeAllRightsDialog({
    open,
    onClose,
    path,
    database,
    databaseFullPath,
    subject,
}: RevokeAllRightsDialogProps) {
    const useMetaProxy = useClusterWithProxy();
    const dialect = useAclSyntax();
    const subjectExplicitRights = useTypedSelector((state) =>
        selectSubjectExplicitRights(
            state,
            subject,
            path,
            database,
            databaseFullPath,
            dialect,
            useMetaProxy,
        ),
    );

    const [requestErrorMessage, setRequestErrorMessage] = React.useState('');
    const [removeAccess, removeAccessResponse] = schemaAclApi.useUpdateAccessMutation();

    const onApply = () => {
        removeAccess({
            path,
            database,
            databaseFullPath,
            dialect,
            rights: {
                RemoveAccess: [
                    {
                        Subject: subject,
                        AccessRights: Array.from(subjectExplicitRights),
                        AccessType: 'Allow',
                    },
                ],
            },
        })
            .unwrap()
            .then(() => {
                onClose();
                createToast({
                    name: 'revokeAllRights',
                    content: i18n('description_rights-revoked'),
                    autoHiding: 3000,
                });
            })
            .catch((error) => {
                setRequestErrorMessage(prepareErrorMessage(error));
            });
    };

    return (
        <Dialog open={open} size="s" onClose={onClose}>
            <Dialog.Header caption={i18n('label_revoke-all-rights')} />
            <Dialog.Body>
                <Flex direction="column" gap={5}>
                    <Text variant="body-2">{i18n('description_revoke-all-rights')}</Text>
                    <SubjectWithAvatar subject={subject} />
                </Flex>
            </Dialog.Body>
            <Dialog.Footer
                onClickButtonApply={onApply}
                textButtonCancel={i18n('action_cancel')}
                textButtonApply={i18n('action_revoke')}
                onClickButtonCancel={onClose}
                propsButtonApply={{
                    loading: removeAccessResponse.isLoading,
                    view: 'outlined-danger',
                }}
            >
                {requestErrorMessage && (
                    <Text color="danger" title={requestErrorMessage}>
                        {requestErrorMessage}
                    </Text>
                )}
            </Dialog.Footer>
        </Dialog>
    );
}

export default RevokeAllRightsDialog;
