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
    const {Donors: donors, ...restData} = data || {};

    const stackId = data?.StringifiedId;
    const isHighlighted = Boolean(stackId && highlightedVDisk === stackId);
    const isDarkened = Boolean(highlightedVDisk && highlightedVDisk !== stackId);

    const handleShowPopup = () => {
        if (stackId) {
            setHighlightedVDisk?.(stackId);
        }
    };

    const handleHidePopup = () => {
        setHighlightedVDisk?.(undefined);
    };

    const commonVDiskProps: Partial<VDiskProps> = {
        withIcon,
        showPopup: isHighlighted,
        highlighted: isHighlighted,
        darkened: isDarkened,
        onShowPopup: handleShowPopup,
        onHidePopup: handleHidePopup,
        ...restProps,
    };

    const content =
        donors && donors.length > 0 ? (
            <Stack className={stackClassName}>
                <VDisk data={restData} {...commonVDiskProps} />
                {donors.map((donor) => {
                    const isFullData = isFullVDiskData(donor);

                    return (
                        <VDisk
                            key={stringifyVdiskId(isFullData ? donor.VDiskId : donor)}
                            data={donor}
                            {...commonVDiskProps}
                        />
                    );
                })}
            </Stack>
        ) : (
            <VDisk data={data} withIcon={withIcon} {...commonVDiskProps} />
        );

    return <div className={className}>{content}</div>;
}
