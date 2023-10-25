export const getArray = (arrayLength: number) => {
    const rows = [];

    for (let i = 0; i < arrayLength; i++) {
        rows.push(i);
    }
    return rows;
};
