import React from 'react';

import type {PopupPlacement, PopupProps} from '@gravity-ui/uikit';

import {useVDiskPagePath} from '../../routes';
import {cn} from '../../utils/cn';
import {NOT_AVAILABLE_SEVERITY} from '../../utils/disks/constants';
import type {
    AllModeIndicatorsState,
    DiskIndicatorValue,
    VDiskDisplayStateGetter,
} from '../../utils/disks/displayState';
import {getDefaultDiskDisplayState} from '../../utils/disks/displayState';
import {getDiskBarTone} from '../../utils/disks/getDiskBarTone';
import {getVDiskStatusIcon} from '../../utils/disks/helpers';
import type {PreparedVDisk} from '../../utils/disks/types';
import {isNumeric} from '../../utils/utils';
import {AllModeIndicators} from '../DiskStateProgressBar/AllModeIndicators';
import {DiskBarLabel} from '../DiskStateProgressBar/DiskBarLabel';
import {DiskIndicator} from '../DiskStateProgressBar/DiskIndicator';
import {DiskStateProgressBar} from '../DiskStateProgressBar/DiskStateProgressBar';
import {HoverPopup} from '../HoverPopup/HoverPopup';
import {InternalLink} from '../InternalLink';
import {VDiskPopup} from '../VDiskPopup/VDiskPopup';

import {i18n} from './i18n';

import './VDisk.scss';

const b = cn('ydb-vdisk-component');

const DEFAULT_POPUP_OFFSET: PopupProps['offset'] = {mainAxis: 2, crossAxis: 0};
const EMPTY_ALL_MODE_INDICATORS = {};

interface GetVDiskBarContentParams {
    allocatedPercent?: number;
    compact?: boolean;
    hidden: boolean;
    noDataPlaceholder?: React.ReactNode;
    severity: number;
    showAllocatedPercentLabel?: boolean;
    showNoDataPlaceholder?: boolean;
}

function getVDiskBarContent({
    allocatedPercent,
    compact,
    hidden,
    noDataPlaceholder,
    severity,
    showAllocatedPercentLabel,
    showNoDataPlaceholder,
}: GetVDiskBarContentParams) {
    if (hidden) {
        return null;
    }

    const hasAllocatedPercent = isNumeric(allocatedPercent) && allocatedPercent >= 0;
    if (!compact && hasAllocatedPercent && showAllocatedPercentLabel !== false) {
        return <DiskBarLabel>{`${Math.floor(allocatedPercent)}%`}</DiskBarLabel>;
    }

    if (!compact && (!hasAllocatedPercent || showNoDataPlaceholder === true) && noDataPlaceholder) {
        return <DiskBarLabel variant="placeholder">{noDataPlaceholder}</DiskBarLabel>;
    }

    if (compact && severity === NOT_AVAILABLE_SEVERITY && noDataPlaceholder) {
        return <DiskBarLabel variant="compact-placeholder">{noDataPlaceholder}</DiskBarLabel>;
    }

    return null;
}

interface GetVDiskBarIndicatorParams {
    hidden: boolean;
    icon?: DiskIndicatorValue;
    isDonor?: boolean;
    placement: 'inline' | 'overlap';
    severity: number;
    withIcon?: boolean;
}

function getVDiskBarIndicator({
    hidden,
    icon,
    isDonor,
    placement,
    severity,
    withIcon,
}: GetVDiskBarIndicatorParams) {
    const resolvedIndicator = icon ?? getVDiskStatusIcon(severity, isDonor);
    if (!withIcon || hidden || !resolvedIndicator) {
        return {leading: null, overflowVisible: false, showIndicator: false};
    }

    return {
        leading: <DiskIndicator value={resolvedIndicator} placement={placement} />,
        overflowVisible: placement === 'overlap',
        showIndicator: true,
    };
}

function getAllModeOverlay(
    compact: boolean | undefined,
    isAllMode: boolean,
    indicators: AllModeIndicatorsState | undefined,
) {
    if (compact || !isAllMode) {
        return null;
    }

    return <AllModeIndicators indicators={indicators ?? EMPTY_ALL_MODE_INDICATORS} />;
}

function getAccessibleName(
    data: PreparedVDisk,
    hasIssues: boolean | undefined,
    isAllMode: boolean,
) {
    if (!isAllMode) {
        return undefined;
    }

    const noData = i18n('context_no-data');
    const health =
        hasIssues === undefined
            ? noData
            : i18n(
                  hasIssues ? 'context_all-mode-health-issues' : 'context_all-mode-health-healthy',
              );
    const allocatedPercent =
        Number.isFinite(data.AllocatedPercent) && Number(data.AllocatedPercent) >= 0
            ? `${data.AllocatedPercent}%`
            : noData;
    const replication =
        data.Replicated === undefined
            ? noData
            : i18n(
                  data.Replicated
                      ? 'context_all-mode-replication-complete'
                      : 'context_all-mode-replication-in-progress',
              );

    return i18n('context_all-mode-accessible-name', {
        vdiskId: data.StringifiedId || noData,
        health,
        state: data.VDiskState || noData,
        replication,
        capacityAlert: data.CapacityAlert || noData,
        frontQueues: data.FrontQueues || noData,
        freshCompaction: data.SatisfactionRank?.FreshRank?.Flag || noData,
        levelCompaction: data.SatisfactionRank?.LevelRank?.Flag || noData,
        allocatedPercent,
    });
}

export interface VDiskProps {
    data?: PreparedVDisk;
    compact?: boolean;
    inactive?: boolean;
    showPopup?: boolean;
    onShowPopup?: VoidFunction;
    onHidePopup?: VoidFunction;
    progressBarClassName?: string;
    delayOpen?: number;
    delayClose?: number;
    withIcon?: boolean;
    highlighted?: boolean;
    placement?: PopupPlacement;
    popupOffset?: PopupProps['offset'];
    withOpaqueBackground?: boolean;
    getDisplayState?: VDiskDisplayStateGetter;
}

export const VDisk = ({
    data = {},
    compact,
    inactive,
    showPopup,
    onShowPopup,
    onHidePopup,
    progressBarClassName,
    delayClose,
    delayOpen,
    withIcon,
    highlighted,
    placement = ['top', 'bottom', 'left', 'right'],
    popupOffset = DEFAULT_POPUP_OFFSET,
    withOpaqueBackground,
    getDisplayState,
}: VDiskProps) => {
    const getVDiskLink = useVDiskPagePath();
    const vDiskPath = getVDiskLink({nodeId: data.NodeId, vDiskId: data.StringifiedId});

    const isDonor = data.DonorMode;

    const displayState = React.useMemo(
        () => (getDisplayState ?? getDefaultDiskDisplayState)(data, isDonor),
        [data, getDisplayState, isDonor],
    );
    const {
        severity,
        icon,
        mode,
        isLegendInactive,
        showNoDataPlaceholder,
        allocatedPercent,
        showAllocatedPercentLabel,
        striped,
        iconPlacement,
        allMode,
    } = displayState;

    const isAllMode = mode === 'all';
    const accessibleName = getAccessibleName(data, allMode?.hasIssues, isAllMode);
    const hideBarContent = Boolean(isLegendInactive && !isDonor);
    const {leading, overflowVisible, showIndicator} = getVDiskBarIndicator({
        hidden: hideBarContent,
        icon,
        isDonor,
        placement: iconPlacement,
        severity,
        withIcon,
    });
    const noDataPlaceholder = showNoDataPlaceholder === false ? undefined : i18n('context_no-data');
    const barContent = getVDiskBarContent({
        allocatedPercent,
        compact,
        hidden: hideBarContent,
        noDataPlaceholder,
        severity,
        showAllocatedPercentLabel,
        showNoDataPlaceholder,
    });
    const overlay = getAllModeOverlay(compact, isAllMode, allMode?.indicators);
    const tone = getDiskBarTone({
        severity,
        isDonor,
        showIndicator,
        indicator: icon,
    });

    return (
        <HoverPopup
            showPopup={showPopup}
            onShowPopup={onShowPopup}
            onHidePopup={onHidePopup}
            renderPopupContent={({onClose}) => <VDiskPopup data={data} onClose={onClose} />}
            offset={popupOffset}
            delayClose={delayClose}
            delayOpen={delayOpen}
            // Allow all placement options, component should choose first available
            placement={placement}
        >
            <div className={b()}>
                <InternalLink
                    to={vDiskPath}
                    aria-label={accessibleName}
                    className={b('content', {
                        compact,
                        'with-opaque-background': withOpaqueBackground,
                    })}
                >
                    <DiskStateProgressBar
                        allocation={allocatedPercent}
                        tone={tone}
                        mode={mode}
                        compact={compact}
                        inactive={inactive}
                        striped={striped}
                        filled={compact && mode === undefined && !striped}
                        className={progressBarClassName}
                        leading={leading}
                        content={barContent}
                        overlay={overlay}
                        highlighted={highlighted}
                        strongFill={allMode?.hasIssues}
                        borderless={isLegendInactive}
                        overflowVisible={overflowVisible}
                    />
                </InternalLink>
            </div>
        </HoverPopup>
    );
};
