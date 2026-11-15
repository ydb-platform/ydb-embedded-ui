import type {PreparedAccessRights, TACE} from '../types/api/acl';

interface SubjectRights {
    explicit: Set<string>;
    effective: Set<string>;
}

/** Groups rights for display; effective rights come from the server, not a local ACL evaluation. */
export function prepareAccessRights(
    acl?: readonly TACE[],
    effectiveAcl?: readonly TACE[],
): PreparedAccessRights[] {
    const rightsBySubject = Object.create(null) as Record<string, SubjectRights>;

    const addRights = (entries: readonly TACE[] | undefined, field: keyof SubjectRights) => {
        for (const entry of entries ?? []) {
            if (!entry.Subject) {
                continue;
            }
            const subjectRights = (rightsBySubject[entry.Subject] ??= {
                explicit: new Set<string>(),
                effective: new Set<string>(),
            });
            for (const right of entry.AccessRules ?? []) {
                subjectRights[field].add(right);
            }
            for (const right of entry.AccessRights ?? []) {
                subjectRights[field].add(right);
            }
        }
    };

    addRights(acl, 'explicit');
    addRights(effectiveAcl, 'effective');

    return Object.entries(rightsBySubject).map(([subject, rights]) => ({
        subject,
        explicit: [...rights.explicit],
        effective: [...rights.effective],
    }));
}
