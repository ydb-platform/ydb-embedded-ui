import {fireEvent, render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';

import {StorageTypeFilter} from './StorageTypeFilter';

test('cluster storage offers NBS tablets and DDisk alongside Groups and Nodes', () => {
    const onChange = jest.fn();
    render(
        <MemoryRouter initialEntries={['/cluster/storage']}>
            <StorageTypeFilter value="groups" onChange={onChange} />
        </MemoryRouter>,
    );
    expect(screen.getAllByRole('radio')).toHaveLength(4);
    fireEvent.click(screen.getByRole('radio', {name: 'NBS tablets'}));
    expect(onChange).toHaveBeenCalledWith('nbs');
    fireEvent.click(screen.getByRole('radio', {name: 'DDisk'}));
    expect(onChange).toHaveBeenCalledWith('ddisks');
});

test('database storage does not display a cluster-wide NBS list', () => {
    render(
        <MemoryRouter initialEntries={['/database']}>
            <StorageTypeFilter value="nbs" onChange={jest.fn()} />
        </MemoryRouter>,
    );
    expect(screen.getAllByRole('radio')).toHaveLength(2);
    expect(screen.getByRole('radio', {name: 'Groups'})).toBeChecked();
});
