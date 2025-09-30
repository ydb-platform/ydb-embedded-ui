import React from 'react';

import {selectSubjectExplicitRights} from '../../../store/reducers/schemaAcl/schemaAcl';
import {useAclSyntax, useTypedSelector} from '../../../utils/hooks';

interface UseRightsProps {
    aclSubject?: string;
    path: string;
    database: string;
    databaseFullPath: string;
}

export function useRights({aclSubject, path, database, databaseFullPath}: UseRightsProps) {
    const dialect = useAclSyntax();
    const subjectExplicitRights = useTypedSelector((state) =>
        selectSubjectExplicitRights(
            state,
            aclSubject ?? undefined,
            path,
            database,
            databaseFullPath,
            dialect,
        ),
    );
    const [explicitRightsChanges, setExplicitRightsChanges] = React.useState(
        () => new Map<string, boolean>(),
    );
    const rightsToGrant = React.useMemo(() => {
        return Array.from(explicitRightsChanges.entries()).reduce<string[]>(
            (acc, [right, status]) => {
                if (status && !subjectExplicitRights.includes(right)) {
                    acc.push(right);
                }
                return acc;
            },
            [],
        );
    }, [explicitRightsChanges, subjectExplicitRights]);

    const rightsToRevoke = React.useMemo(() => {
        return Array.from(explicitRightsChanges.entries()).reduce<string[]>(
            (acc, [right, status]) => {
                if (!status && subjectExplicitRights.includes(right)) {
                    acc.push(right);
                }
                return acc;
            },
            [],
        );
    }, [explicitRightsChanges, subjectExplicitRights]);

    const subjectExplicitRightsMap = React.useMemo(() => {
        return new Map(subjectExplicitRights.map((right) => [right, true]));
    }, [subjectExplicitRights]);

    const currentRightsMap = React.useMemo(() => {
        const rights = new Map(subjectExplicitRightsMap);
        explicitRightsChanges.forEach((value, key) => {
            rights.set(key, value);
        });
        return rights;
    }, [subjectExplicitRightsMap, explicitRightsChanges]);

    const hasChanges = React.useMemo(() => {
        return Boolean(rightsToGrant.length || rightsToRevoke.length);
    }, [rightsToGrant, rightsToRevoke]);

    return {
        currentRightsMap,
        setExplicitRightsChanges,
        rightsToGrant,
        rightsToRevoke,
        hasChanges,
    };
}
