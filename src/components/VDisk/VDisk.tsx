import type {PopupPlacement, PopupProps} from '@gravity-ui/uikit';

import {useVDiskPagePath} from '../../routes';
import {cn} from '../../utils/cn';
import {DISK_COLOR_STATE_TO_NUMERIC_SEVERITY} from '../../utils/disks/constants';
import type {PreparedVDisk} from '../../utils/disks/types';
import {useDiskDisplayState} from '../../utils/disks/useDiskDisplayState';
import {DiskStateProgressBar} from '../DiskStateProgressBar/DiskStateProgressBar';
import {HoverPopup} from '../HoverPopup/HoverPopup';
import {InternalLink} from '../InternalLink';
import {VDiskPopup} from '../VDiskPopup/VDiskPopup';

import {i18n} from './i18n';

import './VDisk.scss';

const b = cn('ydb-vdisk-component');

const DEFAULT_POPUP_OFFSET: PopupProps['offset'] = {mainAxis: 2, crossAxis: 0};

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
    /** Enable expert mode display state (modifiers, icons, etc.) */
    withExpertMode?: boolean;
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
    withExpertMode: enableExpertMode,
}: VDiskProps) => {
    const getVDiskLink = useVDiskPagePath();
    const vDiskPath = getVDiskLink({nodeId: data.NodeId, vDiskId: data.StringifiedId});

    const isDonor = data.DonorMode;

    // Get severity, icon and mode modifier based on expert mode settings
    const {severity, icon, modeModifier} = useDiskDisplayState(data, isDonor, enableExpertMode);

    const isReplicatingColor = severity === DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Blue;

    // In expert mode, don't show disk allocation (filled bar)
    const diskAllocatedPercent = modeModifier ? undefined : data.AllocatedPercent;

    return (
        <HoverPopup
            showPopup={showPopup}
            onShowPopup={onShowPopup}
            onHidePopup={onHidePopup}
            renderPopupContent={() => <VDiskPopup data={data} />}
            offset={popupOffset}
            delayClose={delayClose}
            delayOpen={delayOpen}
            // Allow all placement options, component should choose first available
            placement={placement}
        >
            <div className={b()}>
                <InternalLink to={vDiskPath} className={b('content', {compact})}>
                    <DiskStateProgressBar
                        diskAllocatedPercent={diskAllocatedPercent}
                        severity={severity}
                        compact={compact}
                        inactive={inactive}
                        striped={isReplicatingColor || isDonor}
                        isDonor={isDonor}
                        className={progressBarClassName}
                        withIcon={withIcon}
                        icon={icon}
                        modeModifier={modeModifier}
                        highlighted={highlighted}
                        noDataPlaceholder={i18n('context_no-data')}
                    />
                </InternalLink>
            </div>
        </HoverPopup>
    );
};
