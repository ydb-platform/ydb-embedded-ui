import {i18n, Lang} from '../../i18n';

import en from './en.json';
import ru from './ru.json';

const COMPONENT = 'ydb-bytes-parsers';

i18n.registerKeyset(Lang.En, COMPONENT, en);
i18n.registerKeyset(Lang.Ru, COMPONENT, ru);

export default i18n.keyset(COMPONENT);
