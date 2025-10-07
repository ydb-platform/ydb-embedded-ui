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

    /**
     * Present for vector indexes of type EIndexTypeGlobalFulltext
     */
    FulltextIndexDescription?: TFulltextIndexDescription;
}

export enum EIndexType {
    EIndexTypeInvalid = 'EIndexTypeInvalid',
    EIndexTypeGlobal = 'EIndexTypeGlobal',
    EIndexTypeGlobalAsync = 'EIndexTypeGlobalAsync',
    EIndexTypeGlobalVectorKmeansTree = 'EIndexTypeGlobalVectorKmeansTree',
    EIndexTypeGlobalFulltext = 'EIndexTypeGlobalFulltext',
}

export enum EIndexState {
    EIndexStateInvalid = 'EIndexStateInvalid',
    EIndexStateReady = 'EIndexStateReady',
    EIndexStateNotReady = 'EIndexStateNotReady',
    EIndexStateWriteOnly = 'EIndexStateWriteOnly',
}

export interface TVectorIndexSettings {
    metric?: string;
    vector_type?: string;
    vector_dimension?: number;
}

export interface TKMeansTreeSettings {
    clusters?: number;
    levels?: number;
    settings?: TVectorIndexSettings;
}

export interface TVectorIndexKmeansTreeDescription {
    Settings?: TKMeansTreeSettings;
}

export interface TFulltextIndexAnalyzers {
    tokenizer?: string;
    language?: string;
    use_filter_lowercase?: boolean;
    use_filter_stopwords?: boolean;
    use_filter_ngram?: boolean;
    use_filter_edge_ngram?: boolean;
    filter_ngram_min_length?: number;
    filter_ngram_max_length?: number;
    use_filter_length?: boolean;
    filter_length_min?: number;
    filter_length_max?: number;
}

export interface TFulltextIndexColumnAnalyzers {
    column?: string;
    analyzers?: TFulltextIndexAnalyzers;
}

export interface TFulltextIndexSettings {
    layout?: string;
    columns?: TFulltextIndexColumnAnalyzers[];
}

export interface TFulltextIndexDescription {
    Settings?: TFulltextIndexSettings;
}
