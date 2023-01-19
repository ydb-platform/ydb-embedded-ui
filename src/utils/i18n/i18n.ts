import {I18N} from '@gravity-ui/i18n';
import {configure as configureUiKit} from '@gravity-ui/uikit';
import {configure as configureYdbUiComponents} from 'ydb-ui-components';

enum Lang {
    En = 'en',
    Ru = 'ru',
}

const i18n = new I18N();

i18n.setLang(Lang.En);
configureYdbUiComponents({lang: Lang.En});
configureUiKit({lang: Lang.En});

export {i18n, Lang};
