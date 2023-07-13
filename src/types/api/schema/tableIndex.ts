export interface TIndexDescription {
    Name?: string;
    /** uint64 */
    LocalPathId?: string;

    Type?: EIndexType;
    State?: EIndexState;

    KeyColumnNames?: string[];

    /** uint64 */
    SchemaVersion?: string;

    /** uint64 */
    PathOwnerId?: string;

    DataColumnNames?: string[];
    /** uint64 */
    DataSize?: string;
}

enum EIndexType {
    EIndexTypeInvalid = 'EIndexTypeInvalid',
    EIndexTypeGlobal = 'EIndexTypeGlobal',
    EIndexTypeGlobalAsync = 'EIndexTypeGlobalAsync',
}

enum EIndexState {
    EIndexStateInvalid = 'EIndexStateInvalid',
    EIndexStateReady = 'EIndexStateReady',
    EIndexStateNotReady = 'EIndexStateNotReady',
    EIndexStateWriteOnly = 'EIndexStateWriteOnly',
}
