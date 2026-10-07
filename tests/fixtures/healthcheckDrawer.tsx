import React from 'react';

import {Button, Dialog, Drawer, ThemeProvider} from '@gravity-ui/uikit';
import {createRoot} from 'react-dom/client';
import {Provider} from 'react-redux';

import {DrawerContextProvider} from '../../src/components/Drawer/DrawerContext';
import {HealthcheckDrawer} from '../../src/containers/Tenant/Healthcheck/components/HealthcheckDrawer';
import {store} from '../../src/store/defaultStore';
import {configureUIFactory} from '../../src/uiFactory/uiFactory';

const COMPANION_WIDTH = 320;

function HealthcheckDrawerFixture() {
    const [healthcheckOpen, setHealthcheckOpen] = React.useState(false);
    const [companionOpen, setCompanionOpen] = React.useState(false);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const companionButtonRef = React.useRef<HTMLButtonElement>(null);
    const companionRef = React.useRef<HTMLDivElement>(null);
    const closeHealthcheck = React.useCallback(() => setHealthcheckOpen(false), []);

    const closeCompanion = () => {
        if (companionRef.current?.contains(document.activeElement)) {
            companionButtonRef.current?.focus();
        }
        setCompanionOpen(false);
    };

    return (
        <div style={{height: '100vh'}} data-qa="healthcheck-drawer-fixture">
            <DrawerContextProvider rightInset={companionOpen ? COMPANION_WIDTH : 0}>
                <HealthcheckDrawer
                    isDrawerVisible={healthcheckOpen}
                    onCloseDrawer={closeHealthcheck}
                    drawerId="fixture-healthcheck"
                    storageKey="fixture-healthcheck-width"
                    title="Healthcheck"
                    healthcheckData={{}}
                    downloadFilePrefix="fixture"
                    downloadTooltip="Download Healthcheck"
                    renderDrawerContent={() => (
                        <React.Fragment>
                            <input aria-label="Healthcheck filter" />
                            <Button onClick={() => setDialogOpen(true)}>Open confirmation</Button>
                            <Dialog
                                open={dialogOpen}
                                onClose={() => setDialogOpen(false)}
                                aria-label="Nested confirmation"
                            >
                                <Dialog.Header caption="Nested confirmation" />
                                <Dialog.Body>
                                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                                </Dialog.Body>
                            </Dialog>
                        </React.Fragment>
                    )}
                >
                    <div>
                        <Button onClick={() => setHealthcheckOpen(true)}>Open Healthcheck</Button>
                        <Button
                            ref={companionButtonRef}
                            onClick={(event) => {
                                event.stopPropagation();
                                setCompanionOpen(true);
                            }}
                        >
                            Open companion
                        </Button>
                        <input aria-label="Page input" />
                    </div>
                </HealthcheckDrawer>
            </DrawerContextProvider>
            <div
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                    if (event.key === 'Escape' && !event.defaultPrevented) {
                        event.stopPropagation();
                        closeCompanion();
                    }
                }}
            >
                <Drawer
                    open={companionOpen}
                    onOpenChange={(open, _event, reason) => {
                        if (!open && reason !== 'focus-out') {
                            closeCompanion();
                        }
                    }}
                    floatingRef={companionRef}
                    aria-label="Companion"
                    placement="right"
                    size={COMPANION_WIDTH}
                    style={{position: 'fixed'}}
                    hideVeil
                    disableModal
                    disablePortal
                    disableEscapeKeyDown
                    returnFocus={false}
                >
                    <input aria-label="Companion input" />
                    <Button onClick={closeCompanion}>Close companion</Button>
                </Drawer>
            </div>
        </div>
    );
}

export function renderHealthcheckDrawerFixture(
    mode: Exclude<NonNullable<Window['e2eHealthcheckDrawerMode']>, 'non-modal-page'>,
) {
    const overrides = mode === 'default' ? {} : {disableModal: mode === 'non-modal'};
    configureUIFactory({healthcheck: overrides});

    const container = document.getElementById('root');
    if (!container) {
        throw new Error('Missing fixture root');
    }
    createRoot(container).render(
        <Provider store={store}>
            <ThemeProvider theme="light">
                <HealthcheckDrawerFixture />
            </ThemeProvider>
        </Provider>,
    );
}
