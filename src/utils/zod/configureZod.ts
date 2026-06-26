import {z} from 'zod';
import en from 'zod/v4/locales/en.js';
import ru from 'zod/v4/locales/ru.js';

import {Lang, currentLang} from '../i18n';

const ZOD_LOCALES: Partial<Record<Lang, typeof en>> = {
    [Lang.En]: en,
    [Lang.Ru]: ru,
};

interface ConfigureZodOptions {
    lang?: Lang;
}

export function configureZod({lang = currentLang}: ConfigureZodOptions = {}) {
    const locale = ZOD_LOCALES[lang] ?? en;

    z.config(locale());
}
