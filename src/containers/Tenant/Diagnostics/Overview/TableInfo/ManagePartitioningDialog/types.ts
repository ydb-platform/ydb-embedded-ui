import type {BytesSizes} from '../../../../../../utils/bytesParsers';

// Raw form model: stored and used for initialValues (TextInput works with strings)
export interface ManagePartitioningFormState {
    splitSize: string;
    splitUnit: BytesSizes;
    loadEnabled: boolean;
    loadPercent: string;
    minimum: string;
    maximum: string;
}
