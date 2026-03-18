import React from 'react';

import {stringifyVdiskId} from '../../utils/dataFormatters/dataFormatters';
import {isFullVDiskData} from '../../utils/disks/helpers';
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

export function VDiskWithDonorsStack({
    data,
    className,
    stackClassName,
    withIcon,
    highlightedVDisk,
    setHighlightedVDisk,
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

    const mainVDiskProps: Partial<VDiskProps> = {
        withIcon,
        showPopup: isHighlighted,
        highlighted: isHighlighted,
        onShowPopup: handleShowPopup,
        onHidePopup: handleHidePopup,
        ...restProps,
    };

    const donorVDiskProps: Partial<VDiskProps> = {
        withIcon,
        highlighted: isHighlighted,
        ...restProps,
    };

    const content =
        donors && donors.length > 0 ? (
            <Stack className={stackClassName}>
                <VDisk data={data} {...mainVDiskProps} />
                {donors.map((donor) => {
                    const isFullData = isFullVDiskData(donor);

                    return (
                        <VDisk
                            key={stringifyVdiskId(isFullData ? donor.VDiskId : donor)}
                            data={donor}
                            {...donorVDiskProps}
                        />
                    );
                })}
            </Stack>
        ) : (
            <VDisk data={data} withIcon={withIcon} {...mainVDiskProps} />
        );

    return <div className={className}>{content}</div>;
}
