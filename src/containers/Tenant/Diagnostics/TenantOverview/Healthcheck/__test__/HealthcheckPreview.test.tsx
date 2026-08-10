import {render, screen} from '@testing-library/react';

import type {
    HealthCheckAPIResponse,
    SelfCheckResult,
} from '../../../../../../types/api/healthcheck';
import {HealthcheckPreview} from '../HealthcheckPreview';

let mockHealthcheckData: HealthCheckAPIResponse | undefined;

jest.mock('../../../../../../store/reducers/healthcheckInfo/healthcheckInfo', () => ({
    healthcheckApi: {
        useGetHealthcheckInfoQuery: () => ({
            currentData: mockHealthcheckData,
            isFetching: false,
            error: undefined,
        }),
    },
}));

jest.mock('../../../../../../utils/hooks', () => ({
    useAutoRefreshInterval: () => [0],
}));

jest.mock('../../../../useTenantQueryParams', () => ({
    useTenantQueryParams: () => ({
        handleShowHealthcheckChange: jest.fn(),
    }),
}));

describe('HealthcheckPreview', () => {
    test('renders an unknown status for unsupported self-check results', () => {
        mockHealthcheckData = {
            self_check_result: 'FUTURE_RESULT' as SelfCheckResult,
        };

        render(<HealthcheckPreview database="/Root/database" />);

        expect(screen.getByText('Status is unknown')).toBeInTheDocument();
    });
});
