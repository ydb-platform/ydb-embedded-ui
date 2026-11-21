import {fireEvent, render, screen} from '@testing-library/react';

import {useNbsStorageAvailableInClusterView} from '../../../utils/hooks/useNbsStorageAvailability';

import {StorageTypeFilter} from './StorageTypeFilter';

jest.mock('../../../utils/hooks/useNbsStorageAvailability', () => ({
    useNbsStorageAvailableInClusterView: jest.fn(),
}));

const useNbsAvailable = jest.mocked(useNbsStorageAvailableInClusterView);

test('configured cluster storage offers NBS tablets and DDisk alongside Groups and Nodes', () => {
    useNbsAvailable.mockReturnValue(true);
    const onChange = jest.fn();
    render(<StorageTypeFilter value="groups" onChange={onChange} />);
    expect(screen.getAllByRole('radio')).toHaveLength(4);
    fireEvent.click(screen.getByRole('radio', {name: 'NBS tablets'}));
    expect(onChange).toHaveBeenCalledWith('nbs');
    fireEvent.click(screen.getByRole('radio', {name: 'DDisk'}));
    expect(onChange).toHaveBeenCalledWith('ddisks');
});

test.each([false, undefined])('hides NBS tabs when availability is %s', (availability) => {
    useNbsAvailable.mockReturnValue(availability);
    render(<StorageTypeFilter value="nbs" onChange={jest.fn()} />);
    expect(screen.getAllByRole('radio')).toHaveLength(2);
    expect(screen.getByRole('radio', {name: 'Groups'})).toBeChecked();
});
