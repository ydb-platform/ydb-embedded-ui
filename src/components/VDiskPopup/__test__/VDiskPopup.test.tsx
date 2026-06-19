import {fireEvent, render, screen} from '@testing-library/react';

import type {PreparedVDisk} from '../../../utils/disks/types';
import {VDiskPopup} from '../VDiskPopup';

jest.mock('../../../routes', () => ({
    useVDiskPagePath: () => () => undefined,
}));

jest.mock('../../../store/reducers/nodesList', () => ({
    selectNodesMap: jest.fn(),
}));

jest.mock('../../../utils/developerUI/developerUI', () => ({
    createVDiskDeveloperUILink: jest.fn(),
    useHasDeveloperUi: () => false,
}));

jest.mock('../../../utils/hooks', () => ({
    useTypedDispatch: () => jest.fn(),
    useTypedSelector: () => new Map(),
}));

jest.mock('../../../utils/hooks/useDatabaseFromQuery', () => ({
    useDatabaseFromQuery: () => undefined,
}));

jest.mock('../../../utils/hooks/useIsUserAllowedToMakeChanges', () => ({
    useIsViewerUser: () => false,
}));

jest.mock('../../EvictVDiskButton/EvictVDiskButton', () => ({
    EvictVDiskButton: ({onSuccess}: {onSuccess?: VoidFunction}) => (
        <button onClick={onSuccess} type="button">
            Evict VDisk
        </button>
    ),
    isAllVdiskParamsDefined: (vDiskId?: {
        GroupID?: number;
        GroupGeneration?: number;
        Ring?: number;
        Domain?: number;
        VDisk?: number;
    }) =>
        vDiskId?.GroupID !== undefined &&
        vDiskId?.GroupGeneration !== undefined &&
        vDiskId?.Ring !== undefined &&
        vDiskId?.Domain !== undefined &&
        vDiskId?.VDisk !== undefined,
}));

jest.mock('../../YDBDefinitionList/YDBDefinitionList', () => ({
    YDBDefinitionList: ({footer}: {footer?: React.ReactNode}) => <div>{footer}</div>,
}));

const VDiskPopupWithClose = VDiskPopup as unknown as (props: {
    data: PreparedVDisk;
    onClose?: VoidFunction;
}) => JSX.Element;

describe('VDiskPopup', () => {
    test('closes the host popup after successful VDisk eviction', () => {
        const onClose = jest.fn();
        const vDisk = {
            NodeId: 1,
            StringifiedId: '123-1-0-0-0',
            VDiskId: {
                GroupID: 123,
                GroupGeneration: 1,
                Ring: 0,
                Domain: 0,
                VDisk: 0,
            },
        } as PreparedVDisk;

        render(<VDiskPopupWithClose data={vDisk} onClose={onClose} />);

        fireEvent.click(screen.getByRole('button', {name: 'Evict VDisk'}));

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
