import {cn} from '../../../utils/cn';

import i18n from './i18n';

export const block = cn('ydb-grant-access');

export const HumanReadableRights: Record<string, number> = {
    selectRow: 1,
    updateRow: 2,
    eraseRow: 4,
    writeAttributes: 16,
    createDirectory: 32,
    createTable: 64,
    createQueue: 128,
    removeSchema: 256,
    alterSchema: 1024,
    createDatabase: 2048,
    dropDatabase: 4096,
    readAttributes: 8,
    describeSchema: 512,
    connectDatabase: 32768,
    grantAccessRights: 8192,
    genericRead: 521,
    genericWrite: 17910,
    genericManage: 6144,
    genericList: 520,
    genericUse: 59391,
    genericUseLegacy: 26623,
    genericFull: 65535,
    genericFullLegacy: 32767,
};

export const RightsDescription: Record<number, string> = {
    [HumanReadableRights.selectRow]: i18n('description_select-row'),
    [HumanReadableRights.updateRow]: i18n('description_update-row'),
    [HumanReadableRights.eraseRow]: i18n('description_erase-row'),
    [HumanReadableRights.writeAttributes]: i18n('description_write-attributes'),
    [HumanReadableRights.createDirectory]: i18n('description_create-directory'),
    [HumanReadableRights.createTable]: i18n('description_create-table'),
    [HumanReadableRights.createQueue]: i18n('description_create-queue'),
    [HumanReadableRights.removeSchema]: i18n('description_remove-schema'),
    [HumanReadableRights.alterSchema]: i18n('description_alter-schema'),
    [HumanReadableRights.createDatabase]: i18n('description_create-database'),
    [HumanReadableRights.dropDatabase]: i18n('description_drop-database'),
    [HumanReadableRights.readAttributes]: i18n('description_read-attributes'),
    [HumanReadableRights.describeSchema]: i18n('description_describe-schema'),
    [HumanReadableRights.connectDatabase]: i18n('description_connect-database'),
    [HumanReadableRights.grantAccessRights]: i18n('description_grant-access-rights'),
    [HumanReadableRights.genericRead]: i18n('description_generic-read'),
    [HumanReadableRights.genericWrite]: i18n('description_generic-write'),
    [HumanReadableRights.genericManage]: i18n('description_generic-manage'),
    [HumanReadableRights.genericList]: i18n('description_generic-list'),
    [HumanReadableRights.genericUse]: i18n('description_generic-use'),
    [HumanReadableRights.genericUseLegacy]: i18n('description_generic-use-legacy'),
    [HumanReadableRights.genericFull]: i18n('description_generic-full'),
    [HumanReadableRights.genericFullLegacy]: i18n('description_generic-full-legacy'),
};

export function isLegacyRight(right: number) {
    return (
        right === HumanReadableRights.genericFullLegacy ||
        right === HumanReadableRights.genericUseLegacy
    );
}

export interface CommonRightsProps {
    rights: Map<string, boolean>;
    handleChangeRightGetter: (right: string) => (value: boolean) => void;
    inheritedRights: Set<string>;
}

export type RightsView = 'Granular' | 'Groups';
