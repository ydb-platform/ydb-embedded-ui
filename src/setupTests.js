// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

import {configure as configureUiKit} from '@yandex-cloud/uikit';
import {configure as configureYdbUiComponents} from 'ydb-ui-components';
import {i18n, Lang} from '../src/utils/i18n';

i18n.setLang(Lang.En);
configureYdbUiComponents({lang: Lang.En});
configureUiKit({lang: Lang.En});
