import React from 'react';

import type {PopupPlacement} from '@gravity-ui/uikit';

import type {PreparedVDisk} from '../../utils/disks/types';
import {Stack} from '../Stack/Stack';

import type {VDiskProps} from './VDisk';
import {VDisk} from './VDisk';

interface VDiskWithDonorsStackProps extends VDiskProps {
    data?: PreparedVDisk;
    className?: string;
    stackClassName?: string;
    highlightedVDisk?: string;
    setHighlightedVDisk?: (id?: string) => void;
    progressBarClassName?: string;
}

const diskInStackPlacement: PopupPlacement = ['left', 'right'];

export function VDiskWithDonorsStack({
    data,
    className,
    stackClassName,
    withIcon,
    highlightedVDisk,
    setHighlightedVDisk,
    showPopup: _showPopup,
    onShowPopup: _onShowPopup,
    onHidePopup: _onHidePopup,
    highlighted: _highlighted,
    ...restProps
}: VDiskWithDonorsStackProps) {
    const donors = data?.Donors;

    const stackId = data?.StringifiedId;
    const isHighlighted = Boolean(stackId && highlightedVDisk === stackId);

    const handleShowPopup = React.useCallback(() => {
        if (stackId) {
            setHighlightedVDisk?.(stackId);
        }
    }, [stackId, setHighlightedVDisk]);

    const handleHidePopup = React.useCallback(() => {
        setHighlightedVDisk?.(undefined);
    }, [setHighlightedVDisk]);

    // Spread restProps first, then explicitly override critical fields to prevent
    // external code from breaking the stack's highlight/popup coordination.
    const mainVDiskProps: Partial<VDiskProps> = {
        ...restProps,
        withIcon,
        showPopup: isHighlighted,
        highlighted: isHighlighted,
        onShowPopup: handleShowPopup,
        onHidePopup: handleHidePopup,
    };

    // Donor VDisks intentionally omit popup handlers (showPopup, onShowPopup, onHidePopup).
    // Only the main VDisk acts as the hover target for the entire stack to avoid
    // conflicting interactions when hovering over stacked elements.
    // Popup-related props are destructured and excluded from restProps above.
    const donorVDiskProps: Partial<VDiskProps> = {
        ...restProps,
        withIcon,
        highlighted: isHighlighted,
    };

    const mainDiskPlacement = donors?.length ? diskInStackPlacement : undefined;

    const content =
        donors && donors.length > 0 ? (
            <Stack className={stackClassName}>
                <VDisk placement={mainDiskPlacement} data={data} {...mainVDiskProps} />
                {donors.map((donor, index) => (
                    <VDisk
                        key={`${String(index)}-${donor.StringifiedId}`}
                        data={donor}
                        placement={diskInStackPlacement}
                        {...donorVDiskProps}
                    />
                ))}
            </Stack>
        ) : (
            <VDisk data={data} withIcon={withIcon} {...mainVDiskProps} />
        );

    return <div className={className}>{content}</div>;
}
