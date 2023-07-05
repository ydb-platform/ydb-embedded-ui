import numeral from 'numeral';
import 'numeral/locales'; // Without this numeral will throw an error when using not 'en' locale

import {i18n} from './i18n';

numeral.locale(i18n.lang);

export const configuredNumeral = numeral;
