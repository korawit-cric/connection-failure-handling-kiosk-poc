'use client';

import { useCustomForm, FormWrapper } from '@repo/ui/form/form-wrapper';
import { FormInput } from '@repo/ui/form/form-input';
import { FormTextarea } from '@repo/ui/form/form-textarea';
import { FormButton } from '@repo/ui/form/form-button';
import { z } from 'zod';
import React, { useState } from 'react';

// Example form schema
const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export function FormDemo() {
  const [submittedData, setSubmittedData] = useState<ContactFormData | null>(
    null,
  );

  const form = useCustomForm<ContactFormData>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: '',
    },
    schema: contactFormSchema,
  });

  const handleSubmit = (data: ContactFormData) => {
    console.log('Form submitted:', data);
    setSubmittedData(data);
    // Reset form after successful submission
    setTimeout(() => {
      form.reset();
      setSubmittedData(null);
    }, 3000);
  };

  return (
    <section className="border-surface mt-8 border-t pt-8">
      <h2 className="mb-4 text-xl font-semibold">Form Components Demo</h2>
      <p className="text-foreground/70 mb-6 text-sm">
        Example form using FormWrapper, FormInput, FormTextarea, and FormButton
        with React Hook Form and Zod validation.
      </p>

      <div className="max-w-md space-y-6">
        <FormWrapper formInstance={form} onSubmit={handleSubmit}>
          <div className="space-y-4">
            <FormInput
              name="name"
              label="Name"
              required
              placeholder="Enter your name"
            />

            <FormInput
              name="email"
              label="Email"
              required
              type="email"
              placeholder="Enter your email"
            />

            <FormInput
              name="phone"
              label="Phone"
              type="tel"
              placeholder="Enter your phone number"
            />

            <FormTextarea
              name="message"
              label="Message"
              required
              rows={4}
              placeholder="Enter your message"
            />

            <div className="flex gap-3 pt-2">
              <FormButton type="submit" variant="primary">
                Submit
              </FormButton>
              <FormButton
                type="button"
                variant="secondary"
                onClick={() => form.reset()}
              >
                Reset
              </FormButton>
            </div>
          </div>
        </FormWrapper>

        {submittedData && (
          <div className="bg-success-100 border-success-800 mt-4 rounded-lg border p-4">
            <p className="text-success-800 mb-2 text-sm font-medium">
              Form submitted successfully!
            </p>
            <pre className="text-success-800 overflow-auto text-xs">
              {JSON.stringify(submittedData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
