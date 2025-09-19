import type {ESysViewType} from '../types/api/schema/sysView';

export function prepareSystemViewType(type?: ESysViewType) {
    if (!type) {
        return undefined;
    }
    if (type.startsWith('E')) {
        return type.slice(1);
    }
    return type;
}
