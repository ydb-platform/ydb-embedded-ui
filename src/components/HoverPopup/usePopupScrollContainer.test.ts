import {renderHook} from '@testing-library/react';

import {usePopupScrollContainer} from './usePopupScrollContainer';

test('preserves portal behavior outside tables even inside a scroll container', () => {
    const container = document.createElement('div');
    container.style.overflowY = 'auto';
    const anchor = document.createElement('span');
    container.append(anchor);
    const {result} = renderHook(() => usePopupScrollContainer(anchor, true));
    expect(result.current).toEqual({});
});
