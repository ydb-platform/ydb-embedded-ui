import {CircleInfo, Flask, PencilToSquare, StarFill} from '@gravity-ui/icons';
import type {IconProps} from '@gravity-ui/uikit';
import {createNextState} from '@reduxjs/toolkit';

import {codeAssistBackend} from '../../store';
import {
    ACL_SYNTAX_KEY,
    AUTOCOMPLETE_ON_ENTER,
    AclSyntax,
    BINARY_DATA_IN_PLAIN_TEXT_DISPLAY,
    ENABLE_AUTOCOMPLETE,
    ENABLE_CODE_ASSISTANT,
    ENABLE_NETWORK_TABLE_KEY,
    ENABLE_QUERY_STREAMING,
    INVERTED_DISKS_KEY,
    LANGUAGE_KEY,
    SHOW_DOMAIN_DATABASE_KEY,
    SHOW_NETWORK_UTILIZATION,
    THEME_KEY,
    USE_CLUSTER_BALANCER_AS_BACKEND_KEY,
    USE_SHOW_PLAN_SVG_KEY,
} from '../../utils/constants';
import {Lang, defaultLang} from '../../utils/i18n';

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
    hideTitle?: boolean;
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
};

export const invertedDisksSetting: SettingProps = {
    settingKey: INVERTED_DISKS_KEY,
    title: i18n('settings.invertedDisks.title'),
};

export const enableNetworkTable: SettingProps = {
    settingKey: ENABLE_NETWORK_TABLE_KEY,
    title: i18n('settings.enableNetworkTable.title'),
};

export const useShowPlanToSvgTables: SettingProps = {
    settingKey: USE_SHOW_PLAN_SVG_KEY,
    title: i18n('settings.useShowPlanToSvg.title'),
    description: i18n('settings.useShowPlanToSvg.description'),
};

export const showDomainDatabase: SettingProps = {
    settingKey: SHOW_DOMAIN_DATABASE_KEY,
    title: i18n('settings.showDomainDatabase.title'),
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

export const enableCodeAssistantSetting: SettingProps = {
    settingKey: ENABLE_CODE_ASSISTANT,
    title: i18n('settings.editor.codeAssistant.title'),
    description: i18n('settings.editor.codeAssistant.description'),
};

export const enableQueryStreamingSetting: SettingProps = {
    settingKey: ENABLE_QUERY_STREAMING,
    title: i18n('settings.editor.queryStreaming.title'),
    description: i18n('settings.editor.queryStreaming.description'),
};

export const showNetworkUtilizationSetting: SettingProps = {
    settingKey: SHOW_NETWORK_UTILIZATION,
    title: i18n('settings.showNetworkUtilization.title'),
};

export const autocompleteOnEnterSetting: SettingProps = {
    settingKey: AUTOCOMPLETE_ON_ENTER,
    title: i18n('settings.editor.autocomplete-on-enter.title'),
    description: i18n('settings.editor.autocomplete-on-enter.description'),
};

const aclSyntaxOptions = [
    {
        value: AclSyntax.Kikimr,
        content: i18n('settings.aclSyntax.option-kikimr'),
    },
    {
        value: AclSyntax.YdbShort,
        content: i18n('settings.aclSyntax.option-ydb-short'),
    },
    {
        value: AclSyntax.Ydb,
        content: i18n('settings.aclSyntax.option-ydb'),
    },
    {
        value: AclSyntax.Yql,
        content: i18n('settings.aclSyntax.option-yql'),
    },
];

export const aclSyntaxSetting: SettingProps = {
    settingKey: ACL_SYNTAX_KEY,
    title: i18n('settings.aclSyntax.title'),
    type: 'radio',
    options: aclSyntaxOptions,
};

export const interfaceVersionInfoField: SettingsInfoFieldProps = {
    title: i18n('settings.about.interfaceVersionInfoField.title'),
    type: 'info',
    content: packageJson.version,
};

export const appearanceSection: SettingsSection = {
    id: 'appearanceSection',
    title: i18n('section.appearance'),
    settings: [
        themeSetting,
        invertedDisksSetting,
        binaryDataInPlainTextDisplay,
        showDomainDatabase,
        aclSyntaxSetting,
    ],
};

export const experimentsSection: SettingsSection = {
    id: 'experimentsSection',
    title: i18n('section.experiments'),
    settings: [
        enableNetworkTable,
        useShowPlanToSvgTables,
        enableQueryStreamingSetting,
        showNetworkUtilizationSetting,
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
    hideTitle: true,
};

export const experimentsPage: SettingsPage = {
    id: 'experimentsPage',
    title: i18n('page.experiments'),
    icon: {data: Flask},
    sections: [experimentsSection],
    hideTitle: true,
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
    hideTitle: true,
};

export function getUserSettings({
    singleClusterMode,
    codeAssistantConfigured,
}: {
    singleClusterMode: boolean;
    codeAssistantConfigured?: boolean;
}) {
    const experiments = singleClusterMode
        ? experimentsPage
        : createNextState(experimentsPage, (draft) => {
              draft.sections[0].settings.push(useClusterBalancerAsBackendSetting);
          });

    const editor =
        codeAssistantConfigured || codeAssistBackend
            ? createNextState(editorPage, (draft) => {
                  draft.sections[0].settings.push(enableCodeAssistantSetting);
              })
            : editorPage;

    const settings: YDBEmbeddedUISettings = [generalPage, editor, experiments, aboutPage];

    return settings;
}
