import {renderHook} from '@testing-library/react';

import {SETTING_KEYS} from '../../../../../../store/reducers/settings/constants';
import {getSettingDefault} from '../../../../../../store/reducers/settings/utils';
import {useEditorOptions} from '../useEditorOptions';

let mockWordWrap: unknown;
let mockMultiTabEnabled = false;

jest.mock('../../../../../../utils/hooks', () => ({
    useSetting: (key: string) => [key === 'wordWrap' ? mockWordWrap : true, jest.fn()],
}));

jest.mock('../../../../../../store/reducers/capabilities/hooks', () => ({
    useMultiTabQueryEditorEnabled: () => mockMultiTabEnabled,
}));

describe.each([false, true])('word wrap with multi-tab mode %s', (multiTabEnabled) => {
    beforeEach(() => {
        mockMultiTabEnabled = multiTabEnabled;
        mockWordWrap = getSettingDefault(SETTING_KEYS.WORD_WRAP);
    });

    test('wraps lines by default', () => {
        const {result} = renderHook(() => useEditorOptions());

        expect(mockWordWrap).toBe('on');
        expect(result.current.wordWrap).toBe('on');
    });

    test('applies saved choices and updates the editor options immediately', () => {
        mockWordWrap = 'off';
        const {result, rerender} = renderHook(() => useEditorOptions());
        expect(result.current.wordWrap).toBe('off');

        mockWordWrap = 'on';
        rerender();
        expect(result.current.wordWrap).toBe('on');

        mockWordWrap = 'off';
        rerender();
        expect(result.current.wordWrap).toBe('off');
    });

    test.each([undefined, null, '', 'invalid'])('uses the default for %s', (value) => {
        mockWordWrap = value;
        const {result} = renderHook(() => useEditorOptions());

        expect(result.current.wordWrap).toBe('on');
    });
});
