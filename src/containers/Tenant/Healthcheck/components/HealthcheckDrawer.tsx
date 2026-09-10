import React from 'react';

import {ArrowDownToLine} from '@gravity-ui/icons';
import {ActionTooltip, Button, Icon} from '@gravity-ui/uikit';

import {DrawerWrapper} from '../../../../components/Drawer';
import type {DrawerControl} from '../../../../components/Drawer';
import {EnableFullscreenButton} from '../../../../components/EnableFullscreenButton/EnableFullscreenButton';
import type {SelfCheckResult} from '../../../../types/api/healthcheck';
import {uiFactory} from '../../../../uiFactory/uiFactory';
import {createAndDownloadJsonFile} from '../../../../utils/downloadFile';

import {HealthcheckDrawerTitle} from './HealthcheckDrawerTitle';

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
    const renderDrawerExtension = uiFactory.healthcheck.renderDrawerExtension;
    const renderContentWithExtension = React.useCallback(() => {
        if (!renderDrawerExtension) {
            return renderDrawerContent();
        }

        return (
            <React.Fragment>
                {renderDrawerExtension()}
                {renderDrawerContent()}
            </React.Fragment>
        );
    }, [renderDrawerContent, renderDrawerExtension]);

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
            renderDrawerContent={renderContentWithExtension}
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
