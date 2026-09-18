'use client';

import { forwardRef } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Input, type InputProps } from '../input';

type FormInputProps = Omit<InputProps, 'error'> & {
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
 * FormInput - An Input component that integrates with React Hook Form
 *
 * Automatically handles form state, validation errors, and field registration.
 *
 * @example
 * ```tsx
 * <FormWrapper formInstance={form} onSubmit={handleSubmit}>
 *   <FormInput
 *     name="email"
 *     label="Email"
 *     required
 *     placeholder="Enter your email"
 *   />
 * </FormWrapper>
 * ```
 */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ name, error: customError, ...inputProps }, ref) => {
    const formContext = useFormContext();
    const {
      control,
      formState: { errors },
    } = formContext || {};

    // Get error from form state or custom error
    const fieldError = errors[name];
    const errorMessage =
      customError || (fieldError?.message as string) || undefined;

    // If no form context, render as regular Input
    if (!formContext) {
      return <Input ref={ref} error={errorMessage} {...inputProps} />;
    }

    return (
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Input {...field} {...inputProps} error={errorMessage} />
        )}
      />
    );
  },
);

FormInput.displayName = 'FormInput';
