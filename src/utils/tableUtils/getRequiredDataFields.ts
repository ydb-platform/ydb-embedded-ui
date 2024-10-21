export function getRequiredDataFields<ColumnId extends string, RequiredField extends string>(
    columns: string[],
    columnsToFields: Record<ColumnId, RequiredField[]>,
) {
    const requiredFieldsSet = columns.reduce((fields, column) => {
        const columnFields = columnsToFields[column as ColumnId];
        columnFields.forEach((field) => {
            fields.add(field);
        });

        return fields;
    }, new Set<RequiredField>());

    return Array.from(requiredFieldsSet);
}
