import React from 'react';

import {planToSvgQueryApi} from '../../../../store/reducers/planToSvgQuery';
import type {QueryPlan, ScriptPlan} from '../../../../types/api/query';

interface UsePlanToSvgResult {
    error: string | null;
    blobUrl: string | null;
    isLoading: boolean;
    isUninitialized: boolean;
}

export function usePlanToSvg(database: string, plan?: QueryPlan | ScriptPlan): UsePlanToSvgResult {
    const [error, setError] = React.useState<string | null>(null);
    const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
    const [getPlanToSvg, {isLoading, isUninitialized}] =
        planToSvgQueryApi.usePlanToSvgQueryMutation();

    React.useEffect(() => {
        if (!plan) {
            return undefined;
        }

        let currentUrl: string | null = null;

        getPlanToSvg({plan, database})
            .unwrap()
            .then((result) => {
                const blob = new Blob([result], {type: 'image/svg+xml'});
                currentUrl = URL.createObjectURL(blob);
                setBlobUrl(currentUrl);
                setError(null);
            })
            .catch((err) => {
                setError(JSON.stringify(err));
            });

        return () => {
            if (currentUrl) {
                URL.revokeObjectURL(currentUrl);
            }
        };
    }, [getPlanToSvg, database, plan]);

    return {
        error,
        blobUrl,
        isLoading,
        isUninitialized,
    };
}
