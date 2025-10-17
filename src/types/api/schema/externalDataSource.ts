import type {TPathID} from './shared';

export interface TExternalDataSourceDescription {
    Name?: string;
    PathId?: TPathID;
    /** uint64 */
    Version?: string;
    SourceType?: string;
    Location?: string;
    Installation?: string;
    Auth?: TAuth;
}

interface TAuth {
    None?: NoneAuth;
    ServiceAccount?: ServiceAccountAuth;
    Aws?: AwsAuth;
    Token?: Token;
    MdbBasic?: MdbBasic;
    Basic?: Basic;
}

interface NoneAuth {}

interface ServiceAccountAuth {
    Id?: string;
    SecretName?: string;
}
interface AwsAuth {
    AwsSecretAccessKeySecretName?: string;
    AwsRegion?: string;
    AwsAccessKeyIdSecretName?: string;
}

interface Basic {
    Login?: string;
    PasswordSecretName?: string;
}

interface MdbBasic {
    ServiceAccountId?: string;
    ServiceAccountSecretName?: string;
    Login?: string;
    PasswordSecretName?: string;
}

interface Token {
    TokenSecretName?: string;
}
