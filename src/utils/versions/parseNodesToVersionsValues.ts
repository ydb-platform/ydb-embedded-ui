import type {TableGroup} from '../../store/reducers/storage/types';
import type {TSystemStateInfo} from '../../types/api/nodes';

import {DEFAULT_COLOR} from './getVersionsColors';
import {getMinorVersion} from './parseVersion';
import {sortVersions} from './sortVersions';
import type {PreparedVersion, VersionsDataMap} from './types';

export const parseNodesToPreparedVersions = (
    nodes: TSystemStateInfo[] = [],
    versionsDataMap?: VersionsDataMap,
): PreparedVersion[] => {
    const versionsCount = nodes.reduce<Record<string, number>>((acc, node) => {
        if (node.Version) {
            if (acc[node.Version]) {
                acc[node.Version] = acc[node.Version] + 1;
            } else {
                acc[node.Version] = 1;
            }
        }
        return acc;
    }, {});
    const preparedVersions = Object.keys(versionsCount).map((version) => {
        const minorVersion = getMinorVersion(version);
        const data = versionsDataMap?.get(minorVersion);

        return {
            title: version,
            version: version,
            count: versionsCount[version],
            minorVersion,
            ...data,
        };
    });

    return sortVersions(preparedVersions);
};

export function parseNodeGroupsToPreparedVersions(
    groups: TableGroup[],
    versionsDataMap?: VersionsDataMap,
): PreparedVersion[] {
    const preparedVersions = groups.map((group) => {
        const minorVersion = getMinorVersion(group.name);
        const data = versionsDataMap?.get(minorVersion);

        return {
            title: group.name,
            version: group.name,
            count: group.count,
            minorVersion,
            color: data?.color ?? DEFAULT_COLOR,
            ...data,
        };
    });

    return sortVersions(preparedVersions);
}
