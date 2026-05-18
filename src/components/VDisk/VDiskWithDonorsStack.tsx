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
const diskInStackPopupOffset = {mainAxis: 14, crossAxis: 0};

export function VDiskWithDonorsStack({
    data,
    className,
    stackClassName,
    withIcon,
    compact,
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

    const [internalHighlightedVDisk, setInternalHighlightedVDisk] = React.useState<string>();

    const highlightedVDiskInStack = React.useMemo(() => {
        const donorIds = donors?.map((donor) => donor.StringifiedId) ?? [];

        return Boolean(
            internalHighlightedVDisk &&
                (internalHighlightedVDisk === stackId ||
                    donorIds.includes(internalHighlightedVDisk)),
        );
    }, [internalHighlightedVDisk, stackId, donors]);

    const onShowPopup = React.useCallback(() => {
        if (stackId) {
            setInternalHighlightedVDisk(stackId);
            setHighlightedVDisk?.(stackId);
        }
    }, [setHighlightedVDisk, stackId]);

    const onHidePopup = React.useCallback(() => {
        setInternalHighlightedVDisk(undefined);
        setHighlightedVDisk?.(undefined);
    }, [setHighlightedVDisk]);

    // Spread restProps first, then explicitly override critical fields to prevent
    // external code from breaking the stack's highlight/popup coordination.
    const mainVDiskProps: Partial<VDiskProps> = {
        ...restProps,
        compact,
        withIcon,
        showPopup: stackId === highlightedVDisk,
        highlighted: stackId === highlightedVDisk,
        onShowPopup,
        onHidePopup,
    };

    // Donor VDisks intentionally omit popup handlers (showPopup, onShowPopup, onHidePopup).
    // Only the main VDisk acts as the hover target for the entire stack to avoid
    // conflicting interactions when hovering over stacked elements.
    // Popup-related props are destructured and excluded from restProps above.
    const donorVDiskProps: Partial<VDiskProps> = {
        ...restProps,
        compact,
        withIcon,
        popupOffset: diskInStackPopupOffset,
    };

    const mainDiskPlacement = donors?.length ? diskInStackPlacement : undefined;

    const content =
        donors && donors.length > 0 ? (
            <Stack
                className={stackClassName}
                itemsCount={1 + donors.length}
                compact={compact}
                expanded={highlightedVDiskInStack}
            >
                <VDisk
                    placement={mainDiskPlacement}
                    data={data}
                    popupOffset={highlightedVDiskInStack ? diskInStackPopupOffset : undefined}
                    {...mainVDiskProps}
                />
                {donors.map((donor, index) => (
                    <VDisk
                        key={`${index}-${donor.StringifiedId}`}
                        data={donor}
                        placement={diskInStackPlacement}
                        highlighted={donor.StringifiedId === internalHighlightedVDisk}
                        onShowPopup={() => {
                            if (donor.StringifiedId) {
                                setInternalHighlightedVDisk?.(donor.StringifiedId);
                            }
                        }}
                        onHidePopup={() => {
                            setInternalHighlightedVDisk(undefined);
                        }}
                        {...donorVDiskProps}
                    />
                ))}
            </Stack>
        ) : (
            <VDisk data={data} withIcon={withIcon} {...mainVDiskProps} />
        );

    return <div className={className}>{content}</div>;
}
