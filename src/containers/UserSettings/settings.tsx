import {CircleInfo, Flask, PencilToSquare, StarFill} from '@gravity-ui/icons';
import type {IconProps} from '@gravity-ui/uikit';
import {createNextState} from '@reduxjs/toolkit';

import {
    AUTOCOMPLETE_ON_ENTER,
    BINARY_DATA_IN_PLAIN_TEXT_DISPLAY,
    ENABLE_AUTOCOMPLETE,
    INVERTED_DISKS_KEY,
    LANGUAGE_KEY,
    QUERY_USE_MULTI_SCHEMA_KEY,
    THEME_KEY,
    USE_BACKEND_PARAMS_FOR_TABLES_KEY,
    USE_CLUSTER_BALANCER_AS_BACKEND_KEY,
    USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY,
    USE_SEPARATE_DISKS_PAGES_KEY,
} from '../../utils/constants';
import {Lang, defaultLang} from '../../utils/i18n';
import {ClusterModeGuard} from '../ClusterModeGuard';

import type {SettingProps, SettingsInfoFieldProps} from './Setting';
import i18n from './i18n';

import packageJson from '../../../package.json';

export interface SettingsSection {
    id: string;
    title: string;
    settings: (SettingProps | SettingsInfoFieldProps)[];
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

export const binaryDataInPlainTextDisplay: SettingProps = {
    settingKey: BINARY_DATA_IN_PLAIN_TEXT_DISPLAY,
    title: i18n('settings.binaryDataInPlainTextDisplay.title'),
    description: (
        <ClusterModeGuard mode="multi">
            {i18n('settings.binaryDataInPlainTextDisplay.description')}
        </ClusterModeGuard>
    ),
};

export const invertedDisksSetting: SettingProps = {
    settingKey: INVERTED_DISKS_KEY,
    title: i18n('settings.invertedDisks.title'),
};
export const useNodesEndpointSetting: SettingProps = {
    settingKey: USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY,
    title: i18n('settings.useNodesEndpoint.title'),
    description: i18n('settings.useNodesEndpoint.description'),
};
export const useVirtualTables: SettingProps = {
    settingKey: USE_BACKEND_PARAMS_FOR_TABLES_KEY,
    title: i18n('settings.useVirtualTables.title'),
    description: i18n('settings.useVirtualTables.description'),
};
export const queryUseMultiSchemaSetting: SettingProps = {
    settingKey: QUERY_USE_MULTI_SCHEMA_KEY,
    title: i18n('settings.queryUseMultiSchema.title'),
    description: i18n('settings.queryUseMultiSchema.description'),
};

export const useSeparateDisksPagesSetting: SettingProps = {
    settingKey: USE_SEPARATE_DISKS_PAGES_KEY,
    title: i18n('settings.useSeparateDisksPages.title'),
    description: i18n('settings.useSeparateDisksPages.description'),
};

export const useClusterBalancerAsBackendSetting: SettingProps = {
    settingKey: USE_CLUSTER_BALANCER_AS_BACKEND_KEY,
    title: i18n('settings.useClusterBalancerAsBackend.title'),
    description: i18n('settings.useClusterBalancerAsBackend.description'),
};

export const enableAutocompleteSetting: SettingProps = {
    settingKey: ENABLE_AUTOCOMPLETE,
    title: i18n('settings.editor.autocomplete.title'),
    description: i18n('settings.editor.autocomplete.description'),
};

export const autocompleteOnEnterSetting: SettingProps = {
    settingKey: AUTOCOMPLETE_ON_ENTER,
    title: i18n('settings.editor.autocomplete-on-enter.title'),
    description: i18n('settings.editor.autocomplete-on-enter.description'),
};

export const interfaceVersionInfoField: SettingsInfoFieldProps = {
    title: i18n('settings.about.interfaceVersionInfoField.title'),
    type: 'info',
    content: packageJson.version,
};

export const appearanceSection: SettingsSection = {
    id: 'appearanceSection',
    title: i18n('section.appearance'),
    settings: [themeSetting, invertedDisksSetting, binaryDataInPlainTextDisplay],
};
export const experimentsSection: SettingsSection = {
    id: 'experimentsSection',
    title: i18n('section.experiments'),
    settings: [
        useNodesEndpointSetting,
        useVirtualTables,
        queryUseMultiSchemaSetting,
        useSeparateDisksPagesSetting,
    ],
};
export const devSettingsSection: SettingsSection = {
    id: 'devSettingsSection',
    title: i18n('section.dev-setting'),
    settings: [enableAutocompleteSetting, autocompleteOnEnterSetting],
};

export const aboutSettingsSection: SettingsSection = {
    id: 'aboutSettingsSection',
    title: i18n('section.about'),
    settings: [interfaceVersionInfoField],
};

export const generalPage: SettingsPage = {
    id: 'generalPage',
    title: i18n('page.general'),
    icon: {data: StarFill, height: 14, width: 14},
    sections: [appearanceSection],
};
export const experimentsPage: SettingsPage = {
    id: 'experimentsPage',
    title: i18n('page.experiments'),
    icon: {data: Flask},
    sections: [experimentsSection],
};
export const editorPage: SettingsPage = {
    id: 'editorPage',
    title: i18n('page.editor'),
    icon: {data: PencilToSquare},
    sections: [devSettingsSection],
};

export const aboutPage: SettingsPage = {
    id: 'aboutPage',
    title: i18n('page.about'),
    icon: {data: CircleInfo},
    sections: [aboutSettingsSection],
};

export function getUserSettings({singleClusterMode}: {singleClusterMode: boolean}) {
    const experiments = singleClusterMode
        ? experimentsPage
        : createNextState(experimentsPage, (draft) => {
              draft.sections[0].settings.push(useClusterBalancerAsBackendSetting);
          });

    const settings: YDBEmbeddedUISettings = [generalPage, editorPage, experiments, aboutPage];

    return settings;
}
