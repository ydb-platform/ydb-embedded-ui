// Permissions are derived from the current whoami query result (per-database),
// not from a global slice, so they always match the currently selected database.
// See useWhoami for details.
export {useIsUserAllowedToMakeChanges, useIsViewerUser} from './useWhoami';
