import type {NodesMap} from '../../types/store/nodesList';
import type {PreparedVDisk} from '../../utils/disks/types';
import {stringifyVdiskId} from '../../utils/dataFormatters/dataFormatters';
import {isFullVDiskData} from '../../utils/disks/helpers';

import {Stack} from '../Stack/Stack';
import {VDisk} from './VDisk';

interface VDiskWithDonorsStackProps {
    data?: PreparedVDisk;
    nodes?: NodesMap;
    compact?: boolean;
    className?: string;
    stackClassName?: string;
}

export function VDiskWithDonorsStack({
    data,
    nodes,
    compact,
    className,
    stackClassName,
}: VDiskWithDonorsStackProps) {
    const donors = data?.Donors;

    const content =
        donors && donors.length > 0 ? (
            <Stack className={stackClassName}>
                <VDisk data={data} nodes={nodes} compact={compact} />
                {donors.map((donor) => {
                    const isFullData = isFullVDiskData(donor);

                    // donor and acceptor are always in the same group
                    return (
                        <VDisk
                            key={stringifyVdiskId(isFullData ? donor.VDiskId : donor)}
                            data={donor}
                            nodes={nodes}
                            compact={compact}
                        />
                    );
                })}
            </Stack>
        ) : (
            <VDisk data={data} nodes={nodes} compact={compact} />
        );

    return <div className={className}>{content}</div>;
}
