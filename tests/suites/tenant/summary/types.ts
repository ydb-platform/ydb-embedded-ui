export enum RowTableAction {
    CopyPath = 'Copy path',
    AlterTable = 'Alter table...',
    DropTable = 'Drop table...',
    SelectQuery = 'Select query...',
    UpsertQuery = 'Upsert query...',
    AddIndex = 'Add index...',
    AddVectorIndex = 'Add vector index...',
    AddFulltextIndex = 'Add fulltext index...',
    CreateChangefeed = 'Create changefeed...',
    CreateDirectory = 'Create directory',
}

export enum SecretAction {
    Alter = 'Alter secret...',
    Drop = 'Drop secret...',
}

export enum TopicAction {
    SelectQuery = 'Select query...',
}
