import React from 'react';

import {ArrowDownToLine} from '@gravity-ui/icons';
import {ActionTooltip, Button, Icon} from '@gravity-ui/uikit';

import {DrawerWrapper} from '../../../../components/Drawer';
import type {DrawerControl} from '../../../../components/Drawer';
import type {DrawerSurfaceProps} from '../../../../components/Drawer/Drawer';
import {EnableFullscreenButton} from '../../../../components/EnableFullscreenButton/EnableFullscreenButton';
import {disableFullscreen} from '../../../../store/reducers/fullscreen';
import type {SelfCheckResult} from '../../../../types/api/healthcheck';
import {uiFactory} from '../../../../uiFactory/uiFactory';
import {cn} from '../../../../utils/cn';
import {createAndDownloadJsonFile} from '../../../../utils/downloadFile';
import {useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';

import {HealthcheckDrawerTitle} from './HealthcheckDrawerTitle';
import {HealthcheckPresentationContext} from './HealthcheckPresentationContext';

import './HealthcheckDrawer.scss';

const b = cn('ydb-healthcheck-drawer-content');

function HealthcheckSurface(props: DrawerSurfaceProps) {
    const Renderer = uiFactory.healthcheck.renderDrawerSurface;
    const isFullscreen = useTypedSelector((state) => state.fullscreen);
    const dispatch = useTypedDispatch();
    const fullscreenOpener = React.useRef<HTMLElement | null>(null);
    const setContentRef = React.useCallback(
        (element: HTMLDivElement | null) => {
            if (!element) {
                return;
            }
            if (isFullscreen) {
                fullscreenOpener.current =
                    document.activeElement instanceof HTMLElement ? document.activeElement : null;
                element.querySelector<HTMLButtonElement>('.ydb-fullscreen__close-button')?.focus();
            } else if (fullscreenOpener.current) {
                if (element.contains(fullscreenOpener.current)) {
                    fullscreenOpener.current.focus();
                }
                fullscreenOpener.current = null;
            }
        },
        [isFullscreen],
    );
    const renderContent = () => (
        <HealthcheckPresentationContext.Provider value={true}>
            <div
                className={b({fullscreen: isFullscreen})}
                ref={setContentRef}
                onKeyDown={(event) => {
                    if (
                        !isFullscreen ||
                        event.key !== 'Escape' ||
                        event.defaultPrevented ||
                        !(event.target instanceof Node) ||
                        !event.currentTarget.contains(event.target)
                    ) {
                        return;
                    }
                    const layer =
                        event.target instanceof Element
                            ? event.target.closest(
                                  '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]',
                              )
                            : null;
                    if (layer && event.currentTarget.contains(layer)) {
                        return;
                    }
                    event.preventDefault();
                    event.stopPropagation();
                    dispatch(disableFullscreen());
                }}
            >
                {props.renderContent()}
            </div>
        </HealthcheckPresentationContext.Provider>
    );

    return Renderer ? (
        <Renderer {...props} isFullscreen={isFullscreen} renderContent={renderContent} />
    ) : (
        props.renderDefault()
    );
}

interface HealthcheckDrawerProps {
    children: React.ReactNode;
    isDrawerVisible: boolean;
    onCloseDrawer: () => void;
    onTransitionInComplete?: () => void;
    renderDrawerContent: () => React.ReactNode;
    drawerId: string;
    storageKey: string;
    title: React.ReactNode;
    status?: SelfCheckResult;
    healthcheckData: unknown;
    downloadFilePrefix: string;
    downloadTooltip: string;
    isDownloadDisabled?: boolean;
}

export function HealthcheckDrawer({
    children,
    isDrawerVisible,
    onCloseDrawer,
    onTransitionInComplete,
    renderDrawerContent,
    drawerId,
    storageKey,
    title,
    status,
    healthcheckData,
    downloadFilePrefix,
    downloadTooltip,
    isDownloadDisabled,
}: HealthcheckDrawerProps) {
    const handleDownload = React.useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            createAndDownloadJsonFile(
                healthcheckData,
                `${downloadFilePrefix}-${new Date().getTime()}`,
            );
        },
        [downloadFilePrefix, healthcheckData],
    );

    const drawerControls = React.useMemo<DrawerControl[]>(
        () => [
            {
                type: 'custom',
                key: 'download',
                node: (
                    <ActionTooltip title={downloadTooltip}>
                        <Button
                            view="flat"
                            disabled={isDownloadDisabled}
                            onClick={handleDownload}
                            aria-label={downloadTooltip}
                        >
                            <Icon data={ArrowDownToLine} />
                        </Button>
                    </ActionTooltip>
                ),
            },
            {
                type: 'custom',
                node: <EnableFullscreenButton view="flat" />,
                key: 'fullscreen',
            },
            {type: 'close'},
        ],
        [downloadTooltip, handleDownload, isDownloadDisabled],
    );

    return (
        <DrawerWrapper
            isDrawerVisible={isDrawerVisible}
            onCloseDrawer={onCloseDrawer}
            onTransitionInComplete={onTransitionInComplete}
            renderDrawerContent={renderDrawerContent}
            renderSurface={
                uiFactory.healthcheck.renderDrawerSurface ? HealthcheckSurface : undefined
            }
            drawerId={drawerId}
            storageKey={storageKey}
            detectClickOutside
            hideVeil={false}
            isPercentageWidth
            drawerControls={drawerControls}
            title={<HealthcheckDrawerTitle title={title} status={status} />}
        >
            {children}
        </DrawerWrapper>
    );
}
