import type {AccessRightsUpdate, AccessRightsUpdateRequest, TACE} from '../../../types/api/acl';

interface PrepareAccessRightsUpdateRequestParams {
    subjects: string[];
    rightsToGrant: string[];
    rightsToRevoke: string[];
    subjectExplicitAces: TACE[];
}

export function getSubjectExplicitAces(acl: TACE[] | undefined, subject: string | undefined) {
    if (!acl || !subject) {
        return [];
    }

    return acl.filter((ace) => ace.Subject === subject);
}

function getAceRights(ace: TACE) {
    return [...(ace.AccessRules ?? []), ...(ace.AccessRights ?? [])];
}

function prepareAceForUpdate(ace: TACE, accessRights = getAceRights(ace)) {
    const update: AccessRightsUpdate = {
        Subject: ace.Subject,
        AccessType: ace.AccessType,
        AccessRights: accessRights,
    };

    if (ace.InheritanceType !== undefined) {
        update.InheritanceType = ace.InheritanceType;
    }

    return update;
}

export function prepareAccessRightsUpdateRequest({
    subjects,
    rightsToGrant,
    rightsToRevoke,
    subjectExplicitAces,
}: PrepareAccessRightsUpdateRequestParams): AccessRightsUpdateRequest {
    const addAccess: AccessRightsUpdate[] = subjects.flatMap((subject) =>
        rightsToGrant.map((right) => ({
            Subject: subject,
            AccessType: 'Allow',
            AccessRights: [right],
        })),
    );
    const removeAccess: AccessRightsUpdate[] = [];
    const rightsToRevokeSet = new Set(rightsToRevoke);

    subjectExplicitAces.forEach((ace) => {
        const aceRights = getAceRights(ace);
        if (!aceRights.some((right) => rightsToRevokeSet.has(right))) {
            return;
        }

        removeAccess.push(prepareAceForUpdate(ace));
        aceRights.forEach((right) => {
            if (!rightsToRevokeSet.has(right)) {
                addAccess.push(prepareAceForUpdate(ace, [right]));
            }
        });
    });

    return {
        ...(addAccess.length ? {AddAccess: addAccess} : {}),
        ...(removeAccess.length ? {RemoveAccess: removeAccess} : {}),
    };
}

export function prepareRevokeAllRightsRequest(
    subjectExplicitAces: TACE[],
): AccessRightsUpdateRequest {
    if (!subjectExplicitAces.length) {
        return {};
    }

    return {RemoveAccess: subjectExplicitAces.map((ace) => prepareAceForUpdate(ace))};
}
