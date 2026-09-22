import React from 'react';

import type {PopupPlacement, PopupProps} from '@gravity-ui/uikit';

import {useVDiskPagePath} from '../../routes';
import {isCapacityAlert} from '../../types/api/enums';
import {cn} from '../../utils/cn';
import {NOT_AVAILABLE_SEVERITY} from '../../utils/disks/constants';
import type {
    DiskIndicatorValue,
    VDiskDisplayState,
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

import {getFlagStatusText} from './getFlagStatusText';
import {i18n} from './i18n';

import './VDisk.scss';

const b = cn('ydb-vdisk-component');

const DEFAULT_POPUP_OFFSET: PopupProps['offset'] = {mainAxis: 2, crossAxis: 0};
const EMPTY_ALL_MODE_INDICATORS = {};

interface GetVDiskBarContentParams {
    allocatedPercent?: number;
    compact?: boolean;
    noDataPlaceholder?: React.ReactNode;
    severity: number;
    showAllocatedPercentLabel?: boolean;
    showNoDataPlaceholder?: boolean;
}

function getVDiskBarContent({
    allocatedPercent,
    compact,
    noDataPlaceholder,
    severity,
    showAllocatedPercentLabel,
    showNoDataPlaceholder,
}: GetVDiskBarContentParams) {
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
    indicatorClassName?: string;
    iconGroupSize?: number;
    iconSize?: number;
    isDonor?: boolean;
    placement: 'inline' | 'overlap';
    severity: number;
    withIcon?: boolean;
}

function getVDiskBarIndicator({
    hidden,
    icon,
    indicatorClassName,
    iconGroupSize,
    iconSize,
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
        leading: (
            <DiskIndicator
                value={resolvedIndicator}
                placement={placement}
                iconSize={iconSize}
                iconGroupSize={iconGroupSize}
                className={indicatorClassName}
            />
        ),
        overflowVisible: placement === 'overlap',
        showIndicator: true,
    };
}

function getReplicationAccessibleName(replicated: boolean | undefined) {
    if (replicated === undefined) {
        return i18n('context_no-data');
    }

    return i18n(
        replicated
            ? 'context_all-mode-replication-complete'
            : 'context_all-mode-replication-in-progress',
    );
}

function getAllModeAccessibleName(data: PreparedVDisk, hasIssues: boolean | undefined) {
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
    return i18n('context_all-mode-accessible-name', {
        vdiskId: data.StringifiedId || noData,
        health,
        state: data.VDiskState || data.Status || noData,
        replication: getReplicationAccessibleName(data.Replicated),
        capacityAlert: data.CapacityAlert || noData,
        frontQueues: data.FrontQueues || noData,
        freshCompaction: data.SatisfactionRank?.FreshRank?.Flag || noData,
        levelCompaction: data.SatisfactionRank?.LevelRank?.Flag || noData,
        allocatedPercent,
    });
}

function getAccessibleName(data: PreparedVDisk, {mode, allMode, isNoData}: VDiskDisplayState) {
    if (!mode) {
        return undefined;
    }
    if (mode === 'all') {
        return getAllModeAccessibleName(data, allMode?.hasIssues);
    }

    const noData = i18n('context_no-data');
    let diskName = i18n(data.DonorMode ? 'context_donor-vdisk' : 'context_vdisk', {
        vdiskId: data.StringifiedId || noData,
        nodeId: data.NodeId ?? noData,
    });
    if (isNoData) {
        diskName = i18n('context_vdisk-no-whiteboard', {disk: diskName, noData});
    }

    const {CapacityAlert, FrontQueues, SatisfactionRank, Replicated} = isNoData ? {} : data;
    const {FreshRank, LevelRank} = SatisfactionRank ?? {};

    switch (mode) {
        case 'state':
            return i18n('context_state-accessible-name', {
                disk: diskName,
                state: data.VDiskState || data.Status || noData,
                replication: getReplicationAccessibleName(Replicated),
            });
        case 'space':
            return i18n('context_space-accessible-name', {
                disk: diskName,
                capacityAlert: isCapacityAlert(CapacityAlert) ? CapacityAlert : noData,
            });
        case 'frontQueues':
            return i18n('context_front-queues-accessible-name', {
                disk: diskName,
                frontQueues: getFlagStatusText(FrontQueues),
            });
        case 'compaction':
            return i18n('context_compaction-accessible-name', {
                disk: diskName,
                freshCompaction: getFlagStatusText(FreshRank?.Flag),
                levelCompaction: getFlagStatusText(LevelRank?.Flag),
            });
        default:
            return undefined;
    }
}

export interface VDiskProps {
    data?: PreparedVDisk;
    compact?: boolean;
    allModeSize?: 's' | 'm';
    inactive?: boolean;
    showPopup?: boolean;
    onShowPopup?: VoidFunction;
    onHidePopup?: VoidFunction;
    progressBarClassName?: string;
    delayOpen?: number;
    delayClose?: number;
    withIcon?: boolean;
    iconSize?: number;
    iconGroupSize?: number;
    indicatorClassName?: string;
    highlighted?: boolean;
    placement?: PopupPlacement;
    popupOffset?: PopupProps['offset'];
    withOpaqueBackground?: boolean;
    getDisplayState?: VDiskDisplayStateGetter;
}

export const VDisk = ({
    data = {},
    compact,
    allModeSize,
    inactive,
    showPopup,
    onShowPopup,
    onHidePopup,
    progressBarClassName,
    delayClose,
    delayOpen,
    withIcon,
    iconSize,
    iconGroupSize,
    indicatorClassName,
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
        borderless,
        showNoDataPlaceholder,
        allocatedPercent,
        showAllocatedPercentLabel,
        striped,
        iconPlacement,
        allMode,
        isNoData,
    } = displayState;

    const isAllMode = mode === 'all';
    const accessibleName = getAccessibleName(data, displayState);
    const {leading, overflowVisible, showIndicator} = getVDiskBarIndicator({
        hidden: Boolean(isLegendInactive && !isDonor),
        icon,
        indicatorClassName,
        iconGroupSize,
        iconSize,
        isDonor,
        placement: iconPlacement,
        severity,
        withIcon,
    });
    const noDataPlaceholder = showNoDataPlaceholder === false ? undefined : i18n('context_no-data');
    const barContent = getVDiskBarContent({
        allocatedPercent,
        compact,
        noDataPlaceholder,
        severity,
        showAllocatedPercentLabel,
        showNoDataPlaceholder,
    });
    const overlay =
        !compact && isAllMode && !isNoData ? (
            <AllModeIndicators
                indicators={allMode?.indicators ?? EMPTY_ALL_MODE_INDICATORS}
                size={allModeSize}
            />
        ) : null;
    const tone = getDiskBarTone({
        severity,
        isDonor,
        showIndicator,
        indicator: icon,
        isNoData,
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
                        borderless={borderless}
                        overflowVisible={overflowVisible}
                    />
                </InternalLink>
            </div>
        </HoverPopup>
    );
};
