'use client';

import { forwardRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '../button';
import type { ButtonProps } from '../button';

type FormButtonProps = Omit<ButtonProps, 'type'> & {
  /**
   * Button type - defaults to "submit" for form buttons
   * @default "submit"
   */
  type?: 'button' | 'submit' | 'reset';
  /**
   * Whether to auto-disable based on form state
   * @default true
   */
  autoDisable?: boolean;
};

/**
 * FormButton - A Button component that integrates with React Hook Form
 *
 * Automatically disables submit buttons when form is invalid or submitting.
 *
 * @example
 * ```tsx
 * <FormWrapper formInstance={form} onSubmit={handleSubmit}>
 *   <FormButton type="submit">Submit</FormButton>
 * </FormWrapper>
 * ```
 *
 * @example With auto-disable disabled
 * ```tsx
 * <FormButton type="submit" autoDisable={false}>
 *   Submit Anyway
 * </FormButton>
 * ```
 */
export const FormButton = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  FormButtonProps
>(({ type = 'submit', autoDisable = true, disabled, ...buttonProps }, ref) => {
  const formContext = useFormContext();
  const { isValid = true, isSubmitting = false } = formContext?.formState || {};

  // Auto-disable based on form state when type is submit and autoDisable is true
  const isFormDisabled =
    autoDisable &&
    type === 'submit' &&
    formContext &&
    (!isValid || isSubmitting);

  return (
    <Button
      ref={ref}
      type={type}
      disabled={disabled || isFormDisabled}
      {...buttonProps}
    />
  );
});

FormButton.displayName = 'FormButton';
