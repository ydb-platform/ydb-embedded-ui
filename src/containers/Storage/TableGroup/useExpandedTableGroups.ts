import React from 'react';

export function useExpandedGroups(groups?: readonly {name: string}[]) {
    const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({});

    React.useEffect(() => {
        if (groups?.length) {
            setExpandedGroups((previousExpandedGroups) => {
                const names = groups.map(({name}) => name);
                const previousNames = Object.keys(previousExpandedGroups);
                // Keep the same state object when the groups list is unchanged to avoid extra renders
                if (
                    names.length === previousNames.length &&
                    names.every((name) => Object.hasOwn(previousExpandedGroups, name))
                ) {
                    return previousExpandedGroups;
                }

                // Preserve previously expanded groups on groups list change
                return Object.fromEntries(
                    names.map((name) => [name, previousExpandedGroups[name] ?? false]),
                );
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
