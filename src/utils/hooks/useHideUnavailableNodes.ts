import React from 'react';

import {BooleanParam, useQueryParam} from 'use-query-params';
import {z} from 'zod';

import {
    useCapabilitiesLoaded,
    useViewerNodesAliveFilterAvailable,
} from '../../store/reducers/capabilities/hooks';

const hideUnavailableSchema = z.boolean().catch(false);

export function useHideUnavailableNodes() {
    const [value, setValue] = useQueryParam('hideUnavailable', BooleanParam);
    const available = useViewerNodesAliveFilterAvailable();
    const capabilitiesLoaded = useCapabilitiesLoaded();
    const hideUnavailable = available && hideUnavailableSchema.parse(value);

    React.useEffect(() => {
        if (capabilitiesLoaded && !available && value !== undefined) {
            setValue(undefined, 'replaceIn');
        }
    }, [available, capabilitiesLoaded, setValue, value]);

    const handleHideUnavailableChange = React.useCallback(
        (checked: boolean) => {
            setValue(checked || undefined, 'replaceIn');
        },
        [setValue],
    );

    return {available, hideUnavailable, handleHideUnavailableChange};
}
