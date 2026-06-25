import {render} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';

import {CpuTab} from '../CpuTab';
import {StorageTab} from '../StorageTab';

describe('serverless metric tabs', () => {
    test('renders serverless CPU tab without metric status value', () => {
        const {container} = render(
            <MemoryRouter>
                <CpuTab
                    to="/cpu"
                    active={false}
                    isServerless
                    cpu={{totalUsed: 50, totalLimit: 100}}
                />
            </MemoryRouter>,
        );

        expect(container.querySelector('[data-qa="tenant-metric-tab-title"]')).toHaveTextContent(
            'CPU Load',
        );
        expect(
            container.querySelector('[data-qa="tenant-metric-tab-description"]'),
        ).toHaveTextContent('Auto-Scaled Resources');
        expect(container.querySelector('[data-qa="tenant-metric-tab-value"]')).toBeNull();
    });

    test('renders serverless Storage tab without metric status value', () => {
        const {container} = render(
            <MemoryRouter>
                <StorageTab
                    to="/storage"
                    active={false}
                    isServerless
                    storage={{totalUsed: 50, totalLimit: 100}}
                />
            </MemoryRouter>,
        );

        expect(container.querySelector('[data-qa="tenant-metric-tab-title"]')).toHaveTextContent(
            'Storage',
        );
        expect(
            container.querySelector('[data-qa="tenant-metric-tab-description"]'),
        ).toHaveTextContent('Top Tables By Size');
        expect(container.querySelector('[data-qa="tenant-metric-tab-value"]')).toBeNull();
    });
});
