import {configureUIFactory, uiFactory} from '../uiFactory';

test('enables editor tabs by default and changes the mode only for explicit overrides', () => {
    expect(uiFactory.enableMultiTabQueryEditor).toBe(true);

    configureUIFactory({});
    expect(uiFactory.enableMultiTabQueryEditor).toBe(true);

    configureUIFactory({enableMultiTabQueryEditor: undefined});
    expect(uiFactory.enableMultiTabQueryEditor).toBe(true);

    configureUIFactory({enableMultiTabQueryEditor: false});
    expect(uiFactory.enableMultiTabQueryEditor).toBe(false);

    configureUIFactory({});
    expect(uiFactory.enableMultiTabQueryEditor).toBe(false);

    configureUIFactory({enableMultiTabQueryEditor: undefined});
    expect(uiFactory.enableMultiTabQueryEditor).toBe(false);

    configureUIFactory({enableMultiTabQueryEditor: true});
    expect(uiFactory.enableMultiTabQueryEditor).toBe(true);
});
