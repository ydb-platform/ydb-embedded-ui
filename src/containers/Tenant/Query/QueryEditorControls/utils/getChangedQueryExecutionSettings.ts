import type {QuerySettings} from '../../../../../types/store/query';

export default function getChangedQueryExecutionSettings(
    currentSettings: QuerySettings,
    defaultSettings: QuerySettings,
) {
    return (Object.keys(currentSettings) as (keyof QuerySettings)[]).filter((key) => {
        return currentSettings[key] !== defaultSettings[key];
    });
}
