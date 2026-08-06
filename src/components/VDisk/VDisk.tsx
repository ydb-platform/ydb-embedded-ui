import React from 'react';

import type {PopupPlacement, PopupProps} from '@gravity-ui/uikit';

import {useVDiskPagePath} from '../../routes';
import {cn} from '../../utils/cn';
import {DISK_COLOR_STATE_TO_NUMERIC_SEVERITY} from '../../utils/disks/constants';
import type {DiskDisplayStateGetter} from '../../utils/disks/displayState';
import {getDefaultDiskDisplayState} from '../../utils/disks/displayState';
import type {PreparedVDisk} from '../../utils/disks/types';
import {DiskStateProgressBar} from '../DiskStateProgressBar/DiskStateProgressBar';
import {HoverPopup} from '../HoverPopup/HoverPopup';
import {InternalLink} from '../InternalLink';
import {VDiskPopup} from '../VDiskPopup/VDiskPopup';

import {i18n} from './i18n';

import './VDisk.scss';

const b = cn('ydb-vdisk-component');

const DEFAULT_POPUP_OFFSET: PopupProps['offset'] = {mainAxis: 2, crossAxis: 0};

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
    getDisplayState?: DiskDisplayStateGetter;
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

    const {
        severity,
        icon,
        capacityAlertIndicator,
        frontQueuesIndicator,
        compactionIndicator,
        allModeHasIssues,
        modeModifier,
        isLegendInactive,
        showNoDataPlaceholder,
    } = React.useMemo(
        () => (getDisplayState ?? getDefaultDiskDisplayState)(data, isDonor),
        [data, getDisplayState, isDonor],
    );

    const isAllMode = modeModifier === 'mode-all';
    const accessibleName = getAccessibleName(data, allModeHasIssues, isAllMode);

    // Check if disk is replicating (not replicated yet) and should show stripes
    const hasVDiskData = Boolean(data.VDiskState);
    let isReplicating: boolean;
    if (!modeModifier || modeModifier === 'mode-state' || isAllMode) {
        isReplicating = severity === DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Blue;
    } else {
        // Space mode and other expert modes: show stripes for any Replicated=false disk
        isReplicating = hasVDiskData && data.Replicated === false;
    }

    // Only the default and All modes show disk allocation (filled bar)
    const diskAllocatedPercent = !modeModifier || isAllMode ? data.AllocatedPercent : undefined;
    const shouldShowNoDataPlaceholder =
        showNoDataPlaceholder !== false &&
        !(
            icon &&
            (modeModifier === 'mode-space' ||
                modeModifier === 'mode-frontqueues' ||
                modeModifier === 'mode-compaction')
        );
    const shouldPrioritizeNoDataPlaceholder = isAllMode && showNoDataPlaceholder === true;
    const shouldOverlapIconAtTopLeft = isAllMode && !isDonor && Boolean(withIcon) && Boolean(icon);

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
                        diskAllocatedPercent={diskAllocatedPercent}
                        hideAllocatedPercentLabel={isAllMode}
                        severity={severity}
                        compact={compact}
                        inactive={inactive}
                        striped={isReplicating || isDonor}
                        isDonor={isDonor}
                        className={progressBarClassName}
                        withIcon={withIcon}
                        icon={icon}
                        capacityAlertIndicator={capacityAlertIndicator}
                        frontQueuesIndicator={frontQueuesIndicator}
                        compactionIndicator={compactionIndicator}
                        allModeHasIssues={allModeHasIssues}
                        modeModifier={modeModifier}
                        highlighted={highlighted}
                        noDataPlaceholder={
                            shouldShowNoDataPlaceholder ? i18n('context_no-data') : undefined
                        }
                        prioritizeNoDataPlaceholder={shouldPrioritizeNoDataPlaceholder}
                        overlapIconAtTopLeft={shouldOverlapIconAtTopLeft}
                        isLegendInactive={isLegendInactive}
                    />
                </InternalLink>
            </div>
        </HoverPopup>
    );
};
