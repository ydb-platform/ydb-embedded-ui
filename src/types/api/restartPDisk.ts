export interface RestartPDiskResponse {
    // true if successful, false if not
    result?: boolean;
    // Error message, example: "GroupId# 2181038081 ExpectedStatus# DISINTEGRATED"
    error?: string;
}
