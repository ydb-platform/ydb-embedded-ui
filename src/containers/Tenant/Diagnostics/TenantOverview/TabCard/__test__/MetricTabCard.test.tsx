import {render} from '@testing-library/react';

import {EFlag} from '../../../../../../types/api/enums';
import {MetricTabCard} from '../MetricTabCard';

describe('MetricTabCard', () => {
    test('renders compact title, status value, and description', () => {
        const {container} = render(
            <MetricTabCard
                title="CPU"
                status={EFlag.Green}
                value="7.3%"
                description="Load across all actor system pools"
            />,
        );

        expect(container.querySelector('[data-qa="tenant-metric-tab-title"]')).toHaveTextContent(
            'CPU',
        );
        expect(container.querySelector('[data-qa="tenant-metric-tab-value"]')).toHaveTextContent(
            '7.3%',
        );
        expect(
            container.querySelector('[data-qa="tenant-metric-tab-description"]'),
        ).toHaveTextContent('Load across all actor system pools');
    });
});
