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
}

export function VDiskWithDonorsStack({
    data,
    className,
    stackClassName,
    ...restProps
}: VDiskWithDonorsStackProps) {
    const {Donors: donors, ...restData} = data || {};

    const content =
        donors && donors.length > 0 ? (
            <Stack className={stackClassName}>
                <VDisk data={restData} {...restProps} />
                {donors.map((donor) => {
                    const isFullData = isFullVDiskData(donor);

                    // donor and acceptor are always in the same group
                    return (
                        <VDisk
                            key={stringifyVdiskId(isFullData ? donor.VDiskId : donor)}
                            data={donor}
                            {...restProps}
                        />
                    );
                })}
            </Stack>
        ) : (
            <VDisk data={data} {...restProps} />
        );

    return <div className={className}>{content}</div>;
}
