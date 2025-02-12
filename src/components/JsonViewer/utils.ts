import type {ClassNameList, NoStrictEntityMods} from '@bem-react/classname';

import {block} from './constants';

export function getHightLightedClassName(mix?: ClassNameList) {
    return (mods?: NoStrictEntityMods) => block('filtered', mods, mix);
}
