// Define table names as constants
export const TOP_QUERIES_TABLES = {
    CPU_TIME: {
        ONE_HOUR: '.sys/top_queries_by_cpu_time_one_hour',
        ONE_MINUTE: '.sys/top_queries_by_cpu_time_one_minute',
    },
    DURATION: {
        ONE_HOUR: '.sys/top_queries_by_duration_one_hour',
        ONE_MINUTE: '.sys/top_queries_by_duration_one_minute',
    },
    READ_BYTES: {
        ONE_HOUR: '.sys/top_queries_by_read_bytes_one_hour',
        ONE_MINUTE: '.sys/top_queries_by_read_bytes_one_minute',
    },
    REQUEST_UNITS: {
        ONE_HOUR: '.sys/top_queries_by_request_units_one_hour',
        ONE_MINUTE: '.sys/top_queries_by_request_units_one_minute',
    },
};
