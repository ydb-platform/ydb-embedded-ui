import createToast, {toaster} from '../../../../utils/createToast';

const TOAST_NAME = 'query-settings-warning';

export function showQuerySettingsWarning(title: string) {
    if (toaster.has(TOAST_NAME)) {
        toaster.update(TOAST_NAME, {title});
        return;
    }

    createToast({
        name: TOAST_NAME,
        title,
        theme: 'warning',
        autoHiding: 5000,
    });
}
