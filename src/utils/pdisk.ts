import type {TPDiskStateInfo} from '../types/api/pdisk';

// TODO: move to utils or index after converting them to TS
/**
 * Parses a binary string containing a bit field into an object with binary values.
 * This is an implementation based on string manipulation, since JS can only perform
 * bitwise operations with 32-bits integers, and YDB sends uint64.
 * @see https://en.cppreference.com/w/c/language/bit_field
 * @param binaryString - binary string representing a bit field
 * @param bitFieldStruct - bit field description, <field => size in bits>, in order starting from the rightmost bit
 * @returns object with binary values
 */
export const parseBitField = <T extends Record<string, number>>(
    binaryString: string,
    bitFieldStruct: T,
): Record<keyof T, string> => {
    const fields: Partial<Record<keyof T, string>> = {};

    Object.entries(bitFieldStruct).reduce((prefixSize, [field, size]: [keyof T, number]) => {
        const end = binaryString.length - prefixSize;
        const start = end - size;
        fields[field] = binaryString.substring(start, end) || '0';

        return prefixSize + size;
    }, 0);

    return fields as Record<keyof T, string>;
};

export enum IPDiskType {
    HDD = 'HDD', // ROT (Rotation?) = HDD
    SSD = 'SSD',
    MVME = 'NVME',
}

// Bear with me.
// Disk type is determined by the field Category.
// Category is a bit field defined as follows:
// struct {
//     ui64 IsSolidState : 1;
//     ui64 Kind : 55;
//     ui64 TypeExt : 8;
// }
// For compatibility TypeExt is not used for old types (ROT, SSD), so the following scheme is used:
// ROT  -> IsSolidState# 0, TypeExt# 0
// SSD  -> IsSolidState# 1, TypeExt# 0
// NVME -> IsSolidState# 1, TypeExt# 2
// Reference on bit fields: https://en.cppreference.com/w/c/language/bit_field
export const getPDiskType = (data: TPDiskStateInfo): IPDiskType | undefined => {
    if (!data.Category) {
        return undefined;
    }

    // Category is uint64, too big for Number or bitwise operators, thus BigInt and a custom parser
    const categotyBin = BigInt(data.Category).toString(2);
    const categoryBitField = parseBitField(categotyBin, {
        isSolidState: 1,
        kind: 55,
        typeExt: 8,
    });

    if (categoryBitField.isSolidState === '1') {
        switch (parseInt(categoryBitField.typeExt, 2)) {
            case 0:
                return IPDiskType.SSD;
            case 2:
                return IPDiskType.MVME;
        }
    } else if (categoryBitField.typeExt === '0') {
        return IPDiskType.HDD;
    }

    return undefined;
};
