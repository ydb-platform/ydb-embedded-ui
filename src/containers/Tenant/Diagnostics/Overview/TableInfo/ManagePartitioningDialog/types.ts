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

interface ManagePartitioningFormCommonOutput {
    splitUnit: BytesSizes;
    loadEnabled: boolean;
    minimum: number;
    maximum: number;
}

export type ManagePartitioningFormOutput =
    | (ManagePartitioningFormCommonOutput & {
          splitSizeEnabled: true;
          splitSize: number;
      })
    | (ManagePartitioningFormCommonOutput & {
          splitSizeEnabled: false;
          splitSize: undefined;
      });
