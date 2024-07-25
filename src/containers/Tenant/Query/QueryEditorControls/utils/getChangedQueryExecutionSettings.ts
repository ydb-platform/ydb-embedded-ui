import type {QuerySettings} from '../../../../../types/store/query';

export default function getChangedQueryExecutionSettings(
    currentSettings: QuerySettings,
    defaultSettings: QuerySettings,
): (keyof QuerySettings)[] {
    const currentMap = new Map(Object.entries(currentSettings));
    const defaultMap = new Map(Object.entries(defaultSettings));

    return Array.from(currentMap.keys()).filter(
        (key) => currentMap.get(key) !== defaultMap.get(key),
    ) as (keyof QuerySettings)[];
}
