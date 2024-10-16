export function getRequiredDataFields<
    Column extends {name: string},
    ColumnId extends string,
    RequiredField extends string,
>(columns: Column[], columnsToFields: Record<ColumnId, RequiredField[]>) {
    const columnsIds = columns.map((col) => col.name as ColumnId);
    const requiredFieldsSet = columnsIds.reduce((fields, column) => {
        const columnFields = columnsToFields[column];
        columnFields.forEach((field) => {
            fields.add(field);
        });

        return fields;
    }, new Set<RequiredField>());

    return Array.from(requiredFieldsSet);
}
