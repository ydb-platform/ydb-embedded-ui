import {registerKeysets} from '../../../utils/i18n';

import en from './en.json';
import ru from './ru.json';

// Switch for excluding disconnected nodes from node lists.
export default registerKeysets('ydb-hide-unavailable-nodes-switch', {en, ru});
