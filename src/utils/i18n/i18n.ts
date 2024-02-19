import {I18N} from '@gravity-ui/i18n';
import {configure as configureUiKit} from '@gravity-ui/uikit';
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

export {i18n, Lang, currentLang, defaultLang};
