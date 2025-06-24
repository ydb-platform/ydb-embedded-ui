import {CrownDiamond, Pencil} from '@gravity-ui/icons';
import {ActionTooltip, Button, Card, Divider, Flex, Icon, Text} from '@gravity-ui/uikit';

import {SubjectWithAvatar} from '../../../../../components/SubjectWithAvatar/SubjectWithAvatar';
import {useEditAccessAvailable} from '../../../../../store/reducers/capabilities/hooks';
import {selectSchemaOwner} from '../../../../../store/reducers/schemaAcl/schemaAcl';
import {useAclSyntax, useTypedSelector} from '../../../../../utils/hooks';
import {useCurrentSchema} from '../../../TenantContext';
import i18n from '../i18n';
import {block} from '../shared';

import {getChangeOwnerDialog} from './ChangeOwnerDialog';

export function Owner() {
    const editable = useEditAccessAvailable();
    const {path, database} = useCurrentSchema();
    const dialect = useAclSyntax();
    const owner = useTypedSelector((state) => selectSchemaOwner(state, path, database, dialect));

    if (!owner) {
        return null;
    }

    const renderIcon = () => {
        return (
            <Flex alignItems="center" justifyContent="center" className={block('icon-wrapper')}>
                <Icon data={CrownDiamond} size={14} className={block('avatar-icon')} />
            </Flex>
        );
    };
    return (
        <Flex gap={4} alignItems="center">
            <Card view="filled" className={block('owner-card')}>
                <Flex alignItems="center" justifyContent="space-between" gap={9}>
                    <SubjectWithAvatar
                        subject={owner}
                        renderIcon={renderIcon}
                        title={i18n('title_owner')}
                    />
                    {editable && (
                        <Flex gap={1} alignItems="center">
                            <Divider className={block('owner-divider')} orientation="vertical" />
                            <ActionTooltip title={i18n('action_change-owner')}>
                                <Button
                                    view="flat-secondary"
                                    onClick={() => getChangeOwnerDialog({path, database})}
                                >
                                    <Icon data={Pencil} />
                                </Button>
                            </ActionTooltip>
                        </Flex>
                    )}
                </Flex>
            </Card>
            <Text color="secondary" className={block('owner-description')}>
                {i18n('description_owner')}
            </Text>
        </Flex>
    );
}
