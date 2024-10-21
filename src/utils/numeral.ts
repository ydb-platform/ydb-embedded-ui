import numeral from 'numeral';
import 'numeral/locales'; // Without this numeral will throw an error when using not 'en' locale

import {Lang, i18n} from './i18n';

// Set space delimiter for all locales possible in project
Object.values(Lang).forEach((value) => {
    if (numeral.locales[value]) {
        numeral.locales[value].delimiters.thousands = '\xa0';
    }
});

numeral.locale(i18n.lang);

export const configuredNumeral = numeral;
