export interface TIndexDescription {
    Name?: string;
    /** uint64 */
    LocalPathId?: string;

    Type?: EIndexType;
    State?: EIndexState;

    KeyColumnNames?: string[];

    KeyColumnIds?: number[];

    /** uint64 */
    SchemaVersion?: string;

    /** uint64 */
    PathOwnerId?: string;

    DataColumnNames?: string[];
    /** uint64 */
    DataSize?: string;

    /**
     * Present for vector indexes of type EIndexTypeGlobalVectorKmeansTree
     */
    VectorIndexKmeansTreeDescription?: TVectorIndexKmeansTreeDescription;
}

export enum EIndexType {
    EIndexTypeInvalid = 'EIndexTypeInvalid',
    EIndexTypeGlobal = 'EIndexTypeGlobal',
    EIndexTypeGlobalAsync = 'EIndexTypeGlobalAsync',
    EIndexTypeGlobalVectorKmeansTree = 'EIndexTypeGlobalVectorKmeansTree',
}

export enum EIndexState {
    EIndexStateInvalid = 'EIndexStateInvalid',
    EIndexStateReady = 'EIndexStateReady',
    EIndexStateNotReady = 'EIndexStateNotReady',
    EIndexStateWriteOnly = 'EIndexStateWriteOnly',
}

export interface TVectorIndexKmeansTreeDescriptionSettingsInner {
    vector_dimension?: number;
    vector_type?: string;
    metric?: string;
}

export interface TVectorIndexKmeansTreeDescriptionSettings {
    clusters?: number;
    levels?: number;
    settings?: TVectorIndexKmeansTreeDescriptionSettingsInner;
}

export interface TVectorIndexKmeansTreeDescription {
    Settings?: TVectorIndexKmeansTreeDescriptionSettings;
}
