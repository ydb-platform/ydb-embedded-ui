import type {BytesSizes} from '../../../../../../utils/bytesParsers';

// Raw form model: stored and used for initialValues (TextInput works with strings)
export interface ManagePartitioningFormState {
    splitSizeEnabled: boolean;
    splitSize: string;
    splitUnit: BytesSizes;
    loadEnabled: boolean;
    minimum: string;
    maximum: string;
}
