import type {IconProps} from '@gravity-ui/uikit';

import favoriteFilledIcon from '../../assets/icons/star.svg';
import flaskIcon from '../../assets/icons/flask.svg';

import {
    ENABLE_ADDITIONAL_QUERY_MODES,
    INVERTED_DISKS_KEY,
    LANGUAGE_KEY,
    THEME_KEY,
    USE_BACKEND_PARAMS_FOR_TABLES_KEY,
    USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY,
    QUERY_USE_MULTI_SCHEMA_KEY,
} from '../../utils/constants';
import {Lang, defaultLang} from '../../utils/i18n';

import type {SettingProps} from './Setting';
import i18n from './i18n';

export interface SettingsSection {
    id: string;
    title: string;
    settings: SettingProps[];
}

export interface SettingsPage {
    id: string;
    title: string;
    icon: IconProps;
    sections: SettingsSection[];
}

export type YDBEmbeddedUISettings = SettingsPage[];

const themeOptions = [
    {
        value: 'system',
        content: i18n('settings.theme.option-system'),
    },
    {
        value: 'light',
        content: i18n('settings.theme.option-light'),
    },
    {
        value: 'dark',
        content: i18n('settings.theme.option-dark'),
    },
];

export const themeSetting: SettingProps = {
    settingKey: THEME_KEY,
    title: i18n('settings.theme.title'),
    type: 'radio',
    options: themeOptions,
};

const languageOptions = [
    {
        value: Lang.Ru,
        content: i18n('settings.language.option-russian'),
    },
    {
        value: Lang.En,
        content: i18n('settings.language.option-english'),
    },
];

export const languageSetting: SettingProps = {
    settingKey: LANGUAGE_KEY,
    title: i18n('settings.language.title'),
    type: 'radio',
    options: languageOptions,
    defaultValue: defaultLang,
    onValueUpdate: () => {
        window.location.reload();
    },
};

export const invertedDisksSetting: SettingProps = {
    settingKey: INVERTED_DISKS_KEY,
    title: i18n('settings.invertedDisks.title'),
};
export const useNodesEndpointSetting: SettingProps = {
    settingKey: USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY,
    title: i18n('settings.useNodesEndpoint.title'),
    helpPopoverContent: i18n('settings.useNodesEndpoint.popover'),
};
export const useBackendParamsForTables: SettingProps = {
    settingKey: USE_BACKEND_PARAMS_FOR_TABLES_KEY,
    title: i18n('settings.useBackendParamsForTables.title'),
    helpPopoverContent: i18n('settings.useBackendParamsForTables.popover'),
};
export const enableQueryModesForExplainSetting: SettingProps = {
    settingKey: ENABLE_ADDITIONAL_QUERY_MODES,
    title: i18n('settings.enableAdditionalQueryModes.title'),
    helpPopoverContent: i18n('settings.enableAdditionalQueryModes.popover'),
};
export const queryUseMultiSchemaSetting: SettingProps = {
    settingKey: QUERY_USE_MULTI_SCHEMA_KEY,
    title: i18n('settings.queryUseMultiSchema.title'),
    helpPopoverContent: i18n('settings.queryUseMultiSchema.popover'),
};

export const appearanceSection: SettingsSection = {
    id: 'appearanceSection',
    title: i18n('section.appearance'),
    settings: [themeSetting, invertedDisksSetting],
};
export const experimentsSection: SettingsSection = {
    id: 'experimentsSection',
    title: i18n('section.experiments'),
    settings: [
        useNodesEndpointSetting,
        useBackendParamsForTables,
        enableQueryModesForExplainSetting,
        queryUseMultiSchemaSetting,
    ],
};

export const generalPage: SettingsPage = {
    id: 'generalPage',
    title: i18n('page.general'),
    icon: {data: favoriteFilledIcon, height: 14, width: 14},
    sections: [appearanceSection],
};
export const experimentsPage: SettingsPage = {
    id: 'experimentsPage',
    title: i18n('page.experiments'),
    icon: {data: flaskIcon},
    sections: [experimentsSection],
};

export const settings: YDBEmbeddedUISettings = [generalPage, experimentsPage];
