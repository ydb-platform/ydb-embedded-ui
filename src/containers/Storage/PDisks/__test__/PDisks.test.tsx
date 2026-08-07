import React from 'react';

import {screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';

import {renderWithStore} from '../../../../utils/tests/providers';
import {PDisks} from '../PDisks';

jest.mock('../../../../components/HoverPopup/HoverPopup', () => ({
    HoverPopup: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
}));

test('dims PDisks outside the current PDisk context', () => {
    renderWithStore(
        <MemoryRouter>
            <PDisks
                pDisks={[
                    {NodeId: 42, PDiskId: 1000, StringifiedId: '42-1000'},
                    {NodeId: 42, PDiskId: 1001, StringifiedId: '42-1001'},
                ]}
                viewContext={{nodeId: '42', pDiskId: '1000'}}
            />
        </MemoryRouter>,
    );

    const progressBars = screen.getAllByRole('meter');
    expect(progressBars[0]).not.toHaveClass('storage-disk-progress-bar_inactive');
    expect(progressBars[1]).toHaveClass('storage-disk-progress-bar_inactive');
});
