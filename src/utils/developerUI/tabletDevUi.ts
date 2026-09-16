export function getTabletDevUiAppPage(useSecurePath = false) {
    return useSecurePath ? 'app/secure' : 'app';
}
