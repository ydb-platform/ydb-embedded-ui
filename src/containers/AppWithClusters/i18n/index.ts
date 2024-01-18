import {Lang, i18n} from '../../../utils/i18n';

import en from './en.json';
import ru from './ru.json';

const COMPONENT = 'ydb-internal-user-settings';

i18n.registerKeyset(Lang.En, COMPONENT, en);
i18n.registerKeyset(Lang.Ru, COMPONENT, ru);

export default i18n.keyset(COMPONENT);
