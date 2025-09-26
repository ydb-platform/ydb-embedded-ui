import {z} from 'zod';

import i18n from './i18n';

export const ConfigTypes = {
    current: 'current',
    features: 'features',
    startup: 'startup',
} as const;

export const configTypesSchema = z.nativeEnum(ConfigTypes).catch(ConfigTypes.current);
export type ConfigType = z.infer<typeof configTypesSchema>;

export const ConfigTypeTitles: Record<ConfigType, string> = {
    get current() {
        return i18n('title_current');
    },
    get features() {
        return i18n('title_features');
    },
    get startup() {
        return i18n('title_startup');
    },
};
