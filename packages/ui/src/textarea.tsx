/* eslint-disable no-nested-ternary */ /* better for readability */
'use client';

import { forwardRef } from 'react';
import { cn } from './utils';

/**
 * Textarea Component - Pure presentational component
 *
 * Supports all textarea states: rest, hover, error, active, filled, disabled
 *
 * @example
 * <Textarea label="Note" placeholder="Enter your note" />
 * <Textarea label="Note" required placeholder="Enter your note" />
 * <Textarea label="Note" error="Invalid note" placeholder="Enter your note" />
 * <Textarea label="Note" disabled placeholder="Enter your note" />
 */
export interface TextareaProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'size'
> {
  /**
   * Label text displayed above the textarea
   */
  label?: string;
  /**
   * Whether the field is required (shows asterisk)
   */
  required?: boolean;
  /**
   * Error message (triggers error state)
   */
  error?: string;
  /**
   * Helper text displayed below the textarea
   */
  helperText?: string;
  /**
   * Number of visible text lines (rows)
   */
  rows?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      required = false,
      error,
      helperText,
      rows = 2,
      disabled = false,
      className,
      ...textareaProps
    },
    ref,
  ) => {
    // Determine if textarea has a value (for filled state styling)
    // For controlled textareas (React Hook Form), check value prop
    // For uncontrolled textareas, check defaultValue prop
    const hasValue =
      (textareaProps.value !== undefined && textareaProps.value !== '') ||
      (textareaProps.defaultValue !== undefined &&
        textareaProps.defaultValue !== '');

    // Base textarea styles
    const baseTextareaStyles = cn(
      'min-h-20 w-full resize-y rounded-lg bg-white px-4 py-3 placeholder:text-medium-gray transition-all duration-200 focus:outline-none text-mobile-body1 md:text-desktop-body1',
    );

    // State-based border and text colors
    const stateStyles = disabled
      ? cn(
          'border-2 border-gray bg-lightest-gray cursor-not-allowed',
          hasValue ? 'text-darkest-gray' : 'text-medium-gray ',
        )
      : error
        ? cn('border border-error-300 focus:border-2')
        : // Normal states (rest, hover, active, filled)
          hasValue
          ? cn(
              'border-2 border-medium-gray hover:border-2 hover:border-primary-300 focus:border-2 focus:border-primary-400',
            )
          : cn(
              'border border-medium-gray hover:border-primary-300 focus:border-2 focus:border-primary-400 focus:ring-primary-400/20',
            );

    // Label styles
    const labelStyles =
      'mb-2 block font-bold text-bold-gray text-mobile-caption md:text-desktop-caption';

    // Helper text / Error message styles
    const helperStyles = cn(
      'mt-2 text-mobile-caption md:text-desktop-caption',
      error ? 'text-error-500' : 'text-darkest-gray',
    );

    return (
      <div className={cn('w-full', className)}>
        {label && (
          <label htmlFor={textareaProps.id} className={labelStyles}>
            {label}
            {required && (
              <span className="text-error-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          <textarea
            ref={ref}
            rows={rows}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error || helperText ? `${textareaProps.id}-helper` : undefined
            }
            className={cn(baseTextareaStyles, stateStyles)}
            {...textareaProps}
          />
        </div>

        {(error || helperText) && (
          <p
            id={`${textareaProps.id}-helper`}
            className={helperStyles}
            role={error ? 'alert' : undefined}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
