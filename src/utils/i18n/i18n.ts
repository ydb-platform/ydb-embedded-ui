import {I18N, KeysData} from '@gravity-ui/i18n';
import {configure as configureUiKit} from '@gravity-ui/uikit';
import {configure as configureUiKitComponents} from '@gravity-ui/components';
import {configure as configureUiKitNavigation} from '@gravity-ui/navigation';
import {configure as configureYdbUiComponents} from 'ydb-ui-components';

import {LANGUAGE_KEY} from '../constants';
import {settingsManager} from '../../services/settings';

enum Lang {
    En = 'en',
    Ru = 'ru',
}

const defaultLang = Lang.En;
const currentLang = settingsManager.readUserSettingsValue(LANGUAGE_KEY, defaultLang) as Lang;

const i18n = new I18N();

// Enable keysets with only en lang
i18n.fallbackLang = Lang.En;

i18n.setLang(currentLang);
configureYdbUiComponents({lang: currentLang});
configureUiKit({lang: currentLang});
configureUiKitComponents({lang: currentLang});
configureUiKitNavigation({lang: currentLang});

export function registerKeysets<Keyset extends KeysData>(id: string, data: Record<string, Keyset>) {
    type Keys = Extract<keyof Keyset, string>;

    for (const lang of Object.keys(data)) {
        i18n.registerKeyset(lang, id, data[lang]);
    }

    return i18n.keyset<Keys>(id);
}

export {i18n, Lang, currentLang, defaultLang};
