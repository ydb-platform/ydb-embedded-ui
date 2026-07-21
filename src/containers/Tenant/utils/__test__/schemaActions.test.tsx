import type {DropdownMenuItem} from '@gravity-ui/uikit';

import type {AppDispatch} from '../../../../store';
import {EPathType} from '../../../../types/api/schema';
import {nodeTableTypeToPathType} from '../schema';
import {getActions} from '../schemaActions';

jest.mock('../../../../store/reducers/tenant/tenant', () => ({
    setDiagnosticsTab: (payload: unknown) => ({type: 'tenant/setDiagnosticsTab', payload}),
    setQueryTab: (payload: unknown) => ({type: 'tenant/setQueryTab', payload}),
}));

describe('system view schema actions', () => {
    const schemaData = [{name: 'system_column'}];

    function getSelectAction({
        schemaDataPath,
        isSchemaDataError = false,
        isSchemaDataLoading = false,
    }: {
        schemaDataPath: string;
        isSchemaDataError?: boolean;
        isSchemaDataLoading?: boolean;
    }) {
        const dispatch = jest.fn();
        const additionalEffects = {
            setActivePath: jest.fn(),
            setTenantPage: jest.fn(),
            schemaData,
            schemaDataPath,
            isSchemaDataError,
            isSchemaDataLoading,
        };
        const actionGroups = getActions(
            dispatch as unknown as AppDispatch,
            additionalEffects,
            '/local',
            'local',
        )('/local/.sys/view', 'system_table');
        const selectGroup = actionGroups[1];

        if (!Array.isArray(selectGroup) || !selectGroup[0]) {
            throw new Error('System view select action is not available');
        }

        return {dispatch, selectAction: selectGroup[0] as DropdownMenuItem};
    }

    function getSelectSnippet(params: Parameters<typeof getSelectAction>[0]) {
        const {dispatch, selectAction} = getSelectAction(params);
        selectAction.action?.(new KeyboardEvent('keydown'));
        const dispatchedAction = dispatch.mock.calls[dispatch.mock.calls.length - 1]?.[0];

        return dispatchedAction.payload.pendingSnippet as string;
    }

    test('maps a system-table node to the system-view path type', () => {
        expect(nodeTableTypeToPathType.system_table).toBe(EPathType.EPathTypeSysView);
    });

    test('uses schema data loaded for the action path', () => {
        expect(getSelectSnippet({schemaDataPath: '/local/.sys/view'})).toContain(
            'SELECT `system_column`\nFROM `.sys/view`',
        );
    });

    test.each([
        {schemaDataPath: '/local/table', isSchemaDataError: false},
        {schemaDataPath: '/local/.sys/view', isSchemaDataError: true},
    ])(
        'uses the placeholder for schema path $schemaDataPath when error is $isSchemaDataError',
        (params) => {
            const snippet = getSelectSnippet(params);

            expect(snippet).toContain('SELECT ${1:*}\nFROM `.sys/view`');
            expect(snippet).not.toContain('system_column');
        },
    );

    test('disables Select query while the current schema is loading', () => {
        const {selectAction} = getSelectAction({
            schemaDataPath: '/local/.sys/view',
            isSchemaDataLoading: true,
        });

        expect(selectAction.disabled).toBe(true);
    });
});
