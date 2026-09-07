beforeEach(() => {
    jest.resetModules();
});

test('enables editor tabs by default and preserves the default without an override', async () => {
    const {configureUIFactory, uiFactory} = await import('../uiFactory');

    expect(uiFactory.enableMultiTabQueryEditor).toBe(true);

    configureUIFactory({});
    expect(uiFactory.enableMultiTabQueryEditor).toBe(true);

    configureUIFactory({enableMultiTabQueryEditor: undefined});
    expect(uiFactory.enableMultiTabQueryEditor).toBe(true);
});

test('preserves an explicit single-tab override when later configuration omits it', async () => {
    const {configureUIFactory, uiFactory} = await import('../uiFactory');

    configureUIFactory({enableMultiTabQueryEditor: false});
    expect(uiFactory.enableMultiTabQueryEditor).toBe(false);

    configureUIFactory({});
    expect(uiFactory.enableMultiTabQueryEditor).toBe(false);

    configureUIFactory({enableMultiTabQueryEditor: undefined});
    expect(uiFactory.enableMultiTabQueryEditor).toBe(false);
});

test('allows consumers to enable editor tabs after explicitly disabling them', async () => {
    const {configureUIFactory, uiFactory} = await import('../uiFactory');

    configureUIFactory({enableMultiTabQueryEditor: false});
    configureUIFactory({enableMultiTabQueryEditor: true});

    expect(uiFactory.enableMultiTabQueryEditor).toBe(true);
});
