import React from 'react';

import {render, screen} from '@testing-library/react';

import {PDiskPageLink} from '../PDiskPageLink';

describe('PDiskPageLink', () => {
    test('opens PDisk page link in a new tab', () => {
        render(
            <React.Fragment>
                <PDiskPageLink pDiskId={1001} nodeId={37} />
            </React.Fragment>,
        );

        const link = screen.getByRole('link', {name: /PDisk page/});

        expect(link).toHaveAttribute('href', '/pDisk?nodeId=37&pDiskId=1001');
        expect(link).toHaveAttribute('target', '_blank');
    });
});
