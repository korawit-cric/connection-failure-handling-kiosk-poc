'use client';

import type {
  DefaultValues,
  UseFormProps,
  UseFormReturn,
} from 'react-hook-form';
import { FormProvider, useForm } from 'react-hook-form';
import type { ReactElement } from 'react';
import type { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

type GenericOnSubmit = (
  data: Record<string, unknown>,
  event?: React.BaseSyntheticEvent,
) => void;

/**
 * @example:
 * const form = useCustomForm<LoginFormType>({
 *   defaultValues: {
 *     email: '',
 *     password: '',
 *   },
 *   schema: loginFormSchema,
 * });
 */
export const useCustomForm = <TFormData extends Record<string, unknown>>({
  defaultValues,
  schema,
  mode,
  reValidateMode,
}: {
  defaultValues?: DefaultValues<TFormData>;
  schema: z.ZodType<TFormData>;
} & UseFormProps<TFormData>): UseFormReturn<TFormData> => {
  return useForm<TFormData>({
    defaultValues,
    resolver: zodResolver(schema),
    mode: mode || 'onChange',
    reValidateMode: reValidateMode || 'onChange',
  });
};

type FormWrapperProps<TFormData extends Record<string, unknown>> = {
  formInstance: UseFormReturn<TFormData>;
  onSubmit: (data: TFormData) => void;
  children: React.ReactNode;
  className?: string;
};

export function FormWrapper<TFormData extends Record<string, unknown>>({
  formInstance,
  onSubmit,
  children,
  className,
}: FormWrapperProps<TFormData>): ReactElement {
  const methods = formInstance;

  return (
    <FormProvider {...methods}>
      <form
        className={className}
        onSubmit={methods.handleSubmit(onSubmit as GenericOnSubmit)}
      >
        {children}
      </form>
    </FormProvider>
  );
}
