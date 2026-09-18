'use client';

import { forwardRef } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Textarea, type TextareaProps } from '../textarea';

type FormTextareaProps = Omit<TextareaProps, 'error'> & {
  /**
   * Field name for react-hook-form
   */
  name: string;
  /**
   * Custom error message override
   */
  error?: string;
};

/**
 * FormTextarea - A Textarea component that integrates with React Hook Form
 *
 * Automatically handles form state, validation errors, and field registration.
 *
 * @example
 * ```tsx
 * <FormWrapper formInstance={form} onSubmit={handleSubmit}>
 *   <FormTextarea
 *     name="note"
 *     label="Note"
 *     required
 *     placeholder="Enter your note"
 *   />
 * </FormWrapper>
 * ```
 */
export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ name, error: customError, ...textareaProps }, ref) => {
    const formContext = useFormContext();
    const {
      control,
      formState: { errors },
    } = formContext || {};

    // Get error from form state or custom error
    const fieldError = errors[name];
    const errorMessage =
      customError || (fieldError?.message as string) || undefined;

    // If no form context, render as regular Textarea
    if (!formContext) {
      return <Textarea ref={ref} error={errorMessage} {...textareaProps} />;
    }

    return (
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Textarea {...field} {...textareaProps} error={errorMessage} />
        )}
      />
    );
  },
);

FormTextarea.displayName = 'FormTextarea';
