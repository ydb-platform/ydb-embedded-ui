export const TopicDataFilterValues = {
    TIMESTAMP: 'By Timestamp',
    OFFSET: 'By Offset',
} as const;

export type TopicDataFilterValue = keyof typeof TopicDataFilterValues;

export const isValidTopicDataFilterValue = (value: string): value is TopicDataFilterValue => {
    return Object.keys(TopicDataFilterValues).some((v) => v === value);
};
