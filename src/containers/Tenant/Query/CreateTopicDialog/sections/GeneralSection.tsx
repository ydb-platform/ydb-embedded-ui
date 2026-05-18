import {Text, TextInput} from '@gravity-ui/uikit';
import {Controller, useFormContext} from 'react-hook-form';

import {cn} from '../../../../../utils/cn';
import {FormRow} from '../FormRow';
import i18n from '../i18n';
import type {CreateTopicFormValues} from '../schema';

const b = cn('ydb-create-topic-dialog');

export function GeneralSection() {
    const {
        control,
        formState: {errors},
    } = useFormContext<CreateTopicFormValues>();

    return (
        <div className={b('section')}>
            <Text variant="subheader-2" as="h3" className={b('section-title')}>
                {i18n('section_general-parameters')}
            </Text>
            <FormRow
                title={i18n('field_name')}
                note={i18n('context_field_name', {min: 2})}
                required
                htmlFor="create-topic-name"
            >
                <Controller
                    name="name"
                    control={control}
                    render={({field}) => (
                        <TextInput
                            id="create-topic-name"
                            value={field.value}
                            onUpdate={field.onChange}
                            onBlur={field.onBlur}
                            errorMessage={errors.name?.message}
                            validationState={errors.name ? 'invalid' : undefined}
                            autoFocus
                        />
                    )}
                />
            </FormRow>
        </div>
    );
}
