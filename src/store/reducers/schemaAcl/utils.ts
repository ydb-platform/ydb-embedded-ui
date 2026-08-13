import type {AccessRightsUpdate, AccessRightsUpdateRequest, TACE} from '../../../types/api/acl';

interface PrepareAccessRightsUpdateRequestParams {
    subjects: string[];
    rightsToGrant: string[];
    rightsToRevoke: string[];
    subjectExplicitAces: TACE[];
    supportsNonDefaultInheritanceRevocation: boolean;
}

export function getSubjectExplicitAllowAces(acl: TACE[] | undefined, subject: string | undefined) {
    if (!acl || !subject) {
        return [];
    }

    return acl.filter((ace) => ace.Subject === subject && ace.AccessType === 'Allow');
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

function prepareAceForLegacyUpdate(ace: TACE, accessRights = getAceRights(ace)) {
    return {
        Subject: ace.Subject,
        AccessType: ace.AccessType,
        AccessRights: accessRights,
    };
}

function hasDefaultInheritanceType(ace: TACE) {
    if (ace.InheritanceType === undefined) {
        return true;
    }

    const inheritanceTypes = ace.InheritanceType.map((type) => type.toLowerCase());
    if (inheritanceTypes.length === 1) {
        return inheritanceTypes[0] === 'inherit';
    }

    const inheritanceTypesSet = new Set(inheritanceTypes);
    return (
        inheritanceTypesSet.size === 2 &&
        inheritanceTypesSet.has('object') &&
        inheritanceTypesSet.has('container')
    );
}

export function prepareAccessRightsUpdateRequest({
    subjects,
    rightsToGrant,
    rightsToRevoke,
    subjectExplicitAces,
    supportsNonDefaultInheritanceRevocation,
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
        if (ace.AccessType !== 'Allow') {
            return;
        }

        const aceRights = getAceRights(ace);
        const revokedAceRights = aceRights.filter((right) => rightsToRevokeSet.has(right));
        if (!revokedAceRights.length) {
            return;
        }

        if (!supportsNonDefaultInheritanceRevocation && !hasDefaultInheritanceType(ace)) {
            removeAccess.push(prepareAceForLegacyUpdate(ace, revokedAceRights));
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
    supportsNonDefaultInheritanceRevocation: boolean,
): AccessRightsUpdateRequest {
    const allowAces = subjectExplicitAces.filter((ace) => ace.AccessType === 'Allow');
    if (!allowAces.length) {
        return {};
    }

    return {
        RemoveAccess: allowAces.map((ace) =>
            supportsNonDefaultInheritanceRevocation || hasDefaultInheritanceType(ace)
                ? prepareAceForUpdate(ace)
                : prepareAceForLegacyUpdate(ace),
        ),
    };
}
