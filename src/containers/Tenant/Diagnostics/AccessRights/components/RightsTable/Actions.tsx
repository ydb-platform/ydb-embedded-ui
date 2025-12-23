import {CircleXmark, Pencil} from '@gravity-ui/icons';
import {ActionTooltip, Button, Flex, Icon} from '@gravity-ui/uikit';

import {useEditAccessAvailable} from '../../../../../../store/reducers/capabilities/hooks';
import {useClusterWithProxy} from '../../../../../../store/reducers/cluster/cluster';
import {selectSubjectExplicitRights} from '../../../../../../store/reducers/schemaAcl/schemaAcl';
import {useAclSyntax, useTypedSelector} from '../../../../../../utils/hooks';
import {useCurrentSchema} from '../../../../TenantContext';
import {useTenantQueryParams} from '../../../../useTenantQueryParams';
import i18n from '../../i18n';
import {block} from '../../shared';

import {getRevokeAllRightsDialog} from './RevokeAllRightsDialog';
export function Actions() {
    return null;
}

interface ActionProps {
    subject: string;
    className?: string;
}

export function SubjectActions({subject, className}: ActionProps) {
    const editable = useEditAccessAvailable();
    if (!editable) {
        return null;
    }

    return (
        <Flex gap={1} className={className} alignItems="center">
            <GrantRightsToSubject subject={subject} />
            <RevokeAllRights subject={subject} />
        </Flex>
    );
}

function GrantRightsToSubject({subject}: ActionProps) {
    const {handleShowGrantAccessChange, handleAclSubjectChange} = useTenantQueryParams();
    const handleClick = () => {
        handleShowGrantAccessChange(true);
        handleAclSubjectChange(subject);
    };
    return (
        <ActionTooltip title={i18n('description_grant-explicit-rights')}>
            <Button view="outlined" onClick={handleClick} size="s">
                <Icon data={Pencil} />
            </Button>
        </ActionTooltip>
    );
}

function RevokeAllRights({subject}: ActionProps) {
    const {path, database, databaseFullPath} = useCurrentSchema();
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
    const noRightsToRevoke = subjectExplicitRights.length === 0;

    const handleClick = async () => {
        await getRevokeAllRightsDialog({path, database, databaseFullPath, subject});
    };

    return (
        <ActionTooltip
            title={
                noRightsToRevoke
                    ? i18n('descripition_no-rights-to-revoke')
                    : i18n('label_revoke-all-rights')
            }
        >
            {/* this wrapper is needed to show tooltip if button is disabled */}
            <div className={block('button-wrapper')}>
                <Button onClick={handleClick} disabled={noRightsToRevoke} view="outlined" size="s">
                    <Icon data={CircleXmark} />
                </Button>
            </div>
        </ActionTooltip>
    );
}
