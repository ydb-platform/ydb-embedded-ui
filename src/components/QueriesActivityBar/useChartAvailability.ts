import React from 'react';

import {chartApi} from '../MetricChart/reducer';

/**
 * Hook to check if chart API is available without rendering full chart components.
 * Makes a minimal test query to determine if charts are supported.
 */
export function useChartAvailability(tenantName: string): boolean | null {
    const [isAvailable, setIsAvailable] = React.useState<boolean | null>(null);

    // Make a minimal chart query to test availability
    const {isSuccess, isError} = chartApi.useGetChartDataQuery(
        {
            database: tenantName,
            metrics: [{target: 'queries.requests'}],
            timeFrame: '30m', // Smallest valid time frame
            maxDataPoints: 2, // Minimal data points
        },
        {
            // Skip if we already know the result
            skip: isAvailable !== null,
        },
    );

    React.useEffect(() => {
        if (isSuccess) {
            setIsAvailable(true);
        } else if (isError) {
            setIsAvailable(false);
        }
    }, [isSuccess, isError]);

    return isAvailable;
}
