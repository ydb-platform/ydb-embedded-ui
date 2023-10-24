import crc32 from 'crc-32';

export const generateHash = (value: string) => {
    // 1. crc32.str(value) - generate crc32 hash
    // 2. (>>>) - use unsigned right shift operator (>>>) to avoid negative values
    // 3. toString(16) - convert hash to hex format
    // 4. toUpperCase() - convert hash to uppercase
    // 5. padStart(8, '0') - fill hash with leading zeros if hash length < 8
    // eslint-disable-next-line no-bitwise
    return (crc32.str(value) >>> 0).toString(16).toUpperCase().padStart(8, '0');
};
