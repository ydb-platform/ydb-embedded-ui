import React from 'react';

import type {PopupPlacement} from '@gravity-ui/uikit';

import type {PreparedVDisk} from '../../utils/disks/types';
import {Stack} from '../Stack/Stack';

import type {VDiskProps} from './VDisk';
import {VDisk} from './VDisk';

interface VDiskWithDonorsStackProps extends Omit<VDiskProps, 'withOpaqueBackground'> {
    data?: PreparedVDisk;
    className?: string;
    stackClassName?: string;
    highlightedVDisk?: string;
    setHighlightedVDisk?: (id?: string) => void;
    progressBarClassName?: string;
}

const diskInStackPlacement: PopupPlacement = ['left', 'right'];
const diskInStackPopupOffset = {mainAxis: 7, crossAxis: 0};
const EMPTY_DONORS: PreparedVDisk[] = [];

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
    const donors = data?.Donors ?? EMPTY_DONORS;
    const shouldRenderDonorStack = Boolean(data?.VDiskState && donors.length);

    const stackId = data?.StringifiedId;
    const isHighlighted = Boolean(stackId && highlightedVDisk === stackId);

    const [internalHighlightedVDisk, setInternalHighlightedVDisk] = React.useState<string>();

    const donorIds = React.useMemo(
        () => new Set(donors?.map((donor) => donor.StringifiedId) ?? []),
        [donors],
    );

    const highlightedVDiskInStack = Boolean(
        internalHighlightedVDisk &&
            (internalHighlightedVDisk === stackId || donorIds.has(internalHighlightedVDisk)),
    );

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
        showPopup: isHighlighted,
        highlighted: isHighlighted,
        onShowPopup,
        onHidePopup,
    };

    // Donor VDisks intentionally avoid using and changing highlightedVDiskState.
    // Only the main VDisk acts as the hover target for the entire stack to avoid
    // conflicting interactions when hovering over stacked elements.
    const donorVDiskProps: Partial<VDiskProps> = {
        ...restProps,
        compact,
        withIcon,
        popupOffset: diskInStackPopupOffset,
        withOpaqueBackground: true,
    };

    const mainDiskPlacement = shouldRenderDonorStack ? diskInStackPlacement : undefined;

    const content = shouldRenderDonorStack ? (
        <Stack className={stackClassName} compact={compact} expanded={highlightedVDiskInStack}>
            <VDisk
                placement={mainDiskPlacement}
                data={data}
                popupOffset={highlightedVDiskInStack ? diskInStackPopupOffset : undefined}
                {...mainVDiskProps}
                withOpaqueBackground
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
