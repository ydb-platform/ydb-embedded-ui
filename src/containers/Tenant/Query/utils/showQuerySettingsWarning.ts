import {v4 as uuidv4} from 'uuid';

import createToast, {toaster} from '../../../../utils/createToast';

let currentWarning: {name: string; title: string} | undefined;

export function showQuerySettingsWarning(title: string) {
    if (currentWarning && toaster.has(currentWarning.name)) {
        if (currentWarning.title === title) {
            return;
        }
        toaster.remove(currentWarning.name);
    }

    // A toast fading out can still close itself by name.
    const name = `query-settings-warning-${uuidv4()}`;
    currentWarning = {name, title};
    createToast({
        name,
        title,
        theme: 'warning',
        autoHiding: 5000,
    });
}
