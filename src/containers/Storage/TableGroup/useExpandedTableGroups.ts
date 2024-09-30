import React from 'react';

import type {TableGroup} from '../../../store/reducers/storage/types';

export function useExpandedGroups(groups?: TableGroup[]) {
    const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({});

    React.useEffect(() => {
        if (groups?.length) {
            setExpandedGroups((previousExpandedGroups) => {
                return groups.reduce((result, {name}) => {
                    const previousValue = previousExpandedGroups[name];

                    // Preserve previously expanded groups on groups list change
                    return {
                        ...result,
                        [name]: previousValue ?? false,
                    };
                }, {});
            });
        }
    }, [groups]);

    const setIsGroupExpanded = React.useCallback((name: string, isExpanded: boolean) => {
        setExpandedGroups((previousExpandedGroups) => {
            return {
                ...previousExpandedGroups,
                [name]: isExpanded,
            };
        });
    }, []);

    return {expandedGroups, setIsGroupExpanded};
}
