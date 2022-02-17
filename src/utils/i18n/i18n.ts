import {I18N} from '@yandex-cloud/i18n';

export type Lang = keyof typeof I18N.LANGS;

export const i18n = new I18N();

export {I18N} from '@yandex-cloud/i18n';
