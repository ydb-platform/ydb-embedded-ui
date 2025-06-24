import React from 'react';

import {Flex} from '@gravity-ui/uikit';

import {LoaderWrapper} from '../../../components/LoaderWrapper/LoaderWrapper';
import {SubjectWithAvatar} from '../../../components/SubjectWithAvatar/SubjectWithAvatar';
import {
    schemaAclApi,
    selectAvailablePermissions,
    selectSubjectInheritedRights,
} from '../../../store/reducers/schemaAcl/schemaAcl';
import createToast from '../../../utils/createToast';
import {useAclSyntax, useTypedSelector} from '../../../utils/hooks';
import {prepareErrorMessage} from '../../../utils/prepareErrorMessage';
import {useCurrentSchema} from '../TenantContext';
import {useTenantQueryParams} from '../useTenantQueryParams';

import {Footer} from './components/Footer';
import {Rights} from './components/Rights';
import {RightsSectionSelector} from './components/RightsSectionSelector';
import {SubjectInput} from './components/SubjectInput';
import i18n from './i18n';
import type {RightsView} from './shared';
import {block} from './shared';
import {useRights} from './utils';

import './GrantAccess.scss';

interface GrantAccessProps {
    handleCloseDrawer: () => void;
}

export function GrantAccess({handleCloseDrawer}: GrantAccessProps) {
    const {aclSubject} = useTenantQueryParams();
    const [newSubjects, setNewSubjects] = React.useState<string[]>([]);
    const [rightView, setRightsView] = React.useState<RightsView>('Groups');

    const {path, database} = useCurrentSchema();
    const dialect = useAclSyntax();
    const {currentRightsMap, setExplicitRightsChanges, rightsToGrant, rightsToRevoke, hasChanges} =
        useRights({aclSubject: aclSubject ?? undefined, path, database});
    const {isFetching: aclIsFetching} = schemaAclApi.useGetSchemaAclQuery(
        {
            path,
            database,
            dialect,
        },
        {skip: !aclSubject},
    );
    const {isFetching: availableRightsAreFetching} = schemaAclApi.useGetAvailablePermissionsQuery({
        database,
        dialect,
    });
    const [updateRights, updateRightsResponse] = schemaAclApi.useUpdateAccessMutation();

    const [updateRightsError, setUpdateRightsError] = React.useState('');

    const inheritedRightsSet = useTypedSelector((state) =>
        selectSubjectInheritedRights(state, aclSubject ?? undefined, path, database, dialect),
    );

    const handleDiscardRightsChanges = React.useCallback(() => {
        setExplicitRightsChanges(new Map());
    }, [setExplicitRightsChanges]);

    const handleSaveRightsChanges = React.useCallback(() => {
        const subjects = aclSubject ? [aclSubject] : newSubjects;
        if (!subjects.length) {
            return;
        }
        updateRights({
            path,
            database,
            dialect,
            rights: {
                AddAccess: subjects.map((subj) => ({
                    AccessRights: rightsToGrant,
                    Subject: subj,
                    AccessType: 'Allow',
                })),
                RemoveAccess: subjects.map((subj) => ({
                    AccessRights: rightsToRevoke,
                    Subject: subj,
                    AccessType: 'Allow',
                })),
            },
        })
            .unwrap()
            .then(() => {
                handleCloseDrawer();
                createToast({
                    name: 'updateAcl',
                    content: i18n('label_rights-updated'),
                    autoHiding: 1000,
                    isClosable: false,
                });
            })
            .catch((e) => {
                setUpdateRightsError(prepareErrorMessage(e));
            });
    }, [
        updateRights,
        path,
        database,
        dialect,
        rightsToGrant,
        aclSubject,
        rightsToRevoke,
        newSubjects,
        handleCloseDrawer,
    ]);

    const availablePermissions = useTypedSelector((state) =>
        selectAvailablePermissions(state, database, dialect),
    );
    const handleChangeRightGetter = React.useCallback(
        (right: string) => {
            return (value: boolean) => {
                setUpdateRightsError('');
                setExplicitRightsChanges((prev) => new Map(prev).set(right, value));
            };
        },
        [setExplicitRightsChanges],
    );

    const renderSubject = () => {
        if (aclSubject) {
            return <SubjectWithAvatar subject={aclSubject} />;
        }
        return <SubjectInput newSubjects={newSubjects} setNewSubjects={setNewSubjects} />;
    };

    const subjectSelected = Boolean(aclSubject || newSubjects.length > 0);

    return (
        <LoaderWrapper loading={aclIsFetching || availableRightsAreFetching}>
            <div className={block()}>
                <Flex direction="column">
                    <Flex gap={4} direction="column" className={block('navigation')}>
                        {renderSubject()}
                        {/* wrapper to prevent radio button stretch */}
                        {subjectSelected && (
                            <RightsSectionSelector
                                value={rightView}
                                onUpdate={setRightsView}
                                rights={currentRightsMap}
                                availablePermissions={availablePermissions}
                            />
                        )}
                    </Flex>
                    {subjectSelected && (
                        <div className={block('rights-wrapper')}>
                            <Rights
                                inheritedRights={inheritedRightsSet}
                                rights={currentRightsMap}
                                availablePermissions={availablePermissions}
                                handleChangeRightGetter={handleChangeRightGetter}
                                view={rightView}
                            />
                        </div>
                    )}
                </Flex>

                {subjectSelected && (
                    <Footer
                        onCancel={handleCloseDrawer}
                        onDiscard={handleDiscardRightsChanges}
                        onSave={handleSaveRightsChanges}
                        loading={updateRightsResponse.isLoading}
                        error={updateRightsError}
                        disabled={!hasChanges}
                    />
                )}
            </div>
        </LoaderWrapper>
    );
}
