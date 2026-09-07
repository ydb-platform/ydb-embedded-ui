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

test.each([true, false])('applies an explicit editor tabs override of %s', async (enabled) => {
    const {configureUIFactory, uiFactory} = await import('../uiFactory');

    configureUIFactory({enableMultiTabQueryEditor: enabled});

    expect(uiFactory.enableMultiTabQueryEditor).toBe(enabled);
});

test.each([true, false])(
    'preserves the editor tabs override of %s when later configuration omits it',
    async (enabled) => {
        const {configureUIFactory, uiFactory} = await import('../uiFactory');
        configureUIFactory({enableMultiTabQueryEditor: enabled});

        configureUIFactory({});
        expect(uiFactory.enableMultiTabQueryEditor).toBe(enabled);

        configureUIFactory({enableMultiTabQueryEditor: undefined});
        expect(uiFactory.enableMultiTabQueryEditor).toBe(enabled);
    },
);

test('allows consumers to enable editor tabs after explicitly disabling them', async () => {
    const {configureUIFactory, uiFactory} = await import('../uiFactory');

    configureUIFactory({enableMultiTabQueryEditor: false});
    configureUIFactory({enableMultiTabQueryEditor: true});

    expect(uiFactory.enableMultiTabQueryEditor).toBe(true);
});
