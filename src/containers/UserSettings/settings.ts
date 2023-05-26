import type {IconProps} from '@gravity-ui/uikit';

import favoriteFilledIcon from '../../assets/icons/star.svg';
import flaskIcon from '../../assets/icons/flask.svg';

import {
    ENABLE_QUERY_MODES_FOR_EXPLAIN,
    INVERTED_DISKS_KEY,
    THEME_KEY,
    USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY,
} from '../../utils/constants';

import type {SettingProps} from './Setting';
import i18n from './i18n';

export interface SettingsSection {
    title: string;
    settings: Record<string, SettingProps>;
}

export interface SettingsPage {
    title: string;
    icon: IconProps;
    sections: Record<string, SettingsSection>;
}

export type YDBEmbeddedUISettings = Record<string, SettingsPage>;

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

const themeSetting: SettingProps = {
    settingKey: THEME_KEY,
    title: i18n('settings.theme.title'),
    type: 'radio',
    options: themeOptions,
};
const invertedDisksSetting: SettingProps = {
    settingKey: INVERTED_DISKS_KEY,
    title: i18n('settings.invertedDisks.title'),
};
const useNodesEndpointSetting: SettingProps = {
    settingKey: USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY,
    title: i18n('settings.useNodesEndpoint.title'),
    helpPopoverContent: i18n('settings.useNodesEndpoint.popover'),
};
const enableQueryModesForExplainSetting: SettingProps = {
    settingKey: ENABLE_QUERY_MODES_FOR_EXPLAIN,
    title: i18n('settings.enableQueryModesForExplain.title'),
    helpPopoverContent: i18n('settings.enableQueryModesForExplain.popover'),
};

export const settings: YDBEmbeddedUISettings = {
    general: {
        title: i18n('page.general'),
        icon: {data: favoriteFilledIcon, height: 14, width: 14},
        sections: {
            general: {
                title: i18n('section.general'),
                settings: {
                    [THEME_KEY]: themeSetting,
                },
            },
        },
    },
    experiments: {
        title: i18n('page.experiments'),
        icon: {data: flaskIcon},
        sections: {
            experiments: {
                title: i18n('section.experiments'),
                settings: {
                    [INVERTED_DISKS_KEY]: invertedDisksSetting,
                    [USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY]: useNodesEndpointSetting,
                    [ENABLE_QUERY_MODES_FOR_EXPLAIN]: enableQueryModesForExplainSetting,
                },
            },
        },
    },
};
