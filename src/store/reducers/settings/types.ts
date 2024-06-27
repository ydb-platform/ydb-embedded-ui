import type {SettingsObject} from '../../../services/settings';
import type {ValueOf} from '../../../types/common';

import type {ProblemFilterValues} from './settings';

export type ProblemFilterValue = ValueOf<typeof ProblemFilterValues>;

export interface SettingsState {
    problemFilter: ProblemFilterValue;
    userSettings: SettingsObject;
    systemSettings: SettingsObject;
}
