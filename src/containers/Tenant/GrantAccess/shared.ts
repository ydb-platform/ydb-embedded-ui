import {cn} from '../../../utils/cn';

import i18n from './i18n';

export const block = cn('ydb-grant-access');

export const RightsCodes: Record<string, number> = {
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
    [RightsCodes.selectRow]: i18n('description_select-row'),
    [RightsCodes.updateRow]: i18n('description_update-row'),
    [RightsCodes.eraseRow]: i18n('description_erase-row'),
    [RightsCodes.writeAttributes]: i18n('description_write-attributes'),
    [RightsCodes.createDirectory]: i18n('description_create-directory'),
    [RightsCodes.createTable]: i18n('description_create-table'),
    [RightsCodes.createQueue]: i18n('description_create-queue'),
    [RightsCodes.removeSchema]: i18n('description_remove-schema'),
    [RightsCodes.alterSchema]: i18n('description_alter-schema'),
    [RightsCodes.createDatabase]: i18n('description_create-database'),
    [RightsCodes.dropDatabase]: i18n('description_drop-database'),
    [RightsCodes.readAttributes]: i18n('description_read-attributes'),
    [RightsCodes.describeSchema]: i18n('description_describe-schema'),
    [RightsCodes.connectDatabase]: i18n('description_connect-database'),
    [RightsCodes.grantAccessRights]: i18n('description_grant-access-rights'),
    [RightsCodes.genericRead]: i18n('description_generic-read'),
    [RightsCodes.genericWrite]: i18n('description_generic-write'),
    [RightsCodes.genericManage]: i18n('description_generic-manage'),
    [RightsCodes.genericList]: i18n('description_generic-list'),
    [RightsCodes.genericUse]: i18n('description_generic-use'),
    [RightsCodes.genericUseLegacy]: i18n('description_generic-use-legacy'),
    [RightsCodes.genericFull]: i18n('description_generic-full'),
    [RightsCodes.genericFullLegacy]: i18n('description_generic-full-legacy'),
};

export function isLegacyRight(right: number) {
    return right === RightsCodes.genericFullLegacy || right === RightsCodes.genericUseLegacy;
}

export interface CommonRightsProps {
    rights: Map<string, boolean>;
    handleChangeRightGetter: (right: string) => (value: boolean) => void;
    inheritedRights: Set<string>;
}

export type RightsView = 'Granular' | 'Groups';
