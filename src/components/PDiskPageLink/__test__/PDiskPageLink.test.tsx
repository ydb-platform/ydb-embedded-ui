import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';

import {PDiskPageLink} from '../PDiskPageLink';

describe('PDiskPageLink', () => {
    test('renders PDisk page link as an internal link', () => {
        render(
            <MemoryRouter>
                <PDiskPageLink pDiskId={1001} nodeId={37} />
            </MemoryRouter>,
        );

        const link = screen.getByRole('link', {name: /PDisk page/});

        expect(link).toHaveAttribute('href', '/pDisk?nodeId=37&pDiskId=1001');
        expect(link).not.toHaveAttribute('target', '_blank');
    });
});
