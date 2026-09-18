'use client';

import { Input } from '@repo/ui/input';
import { AddUser } from '@repo/icons';
import React from 'react';

export function InputDemo() {
  return (
    <section className="border-surface mt-8 border-t pt-8">
      <h2 className="mb-4 text-xl font-semibold">Input Component</h2>

      <div className="space-y-6">
        {/* Basic Input */}
        <div>
          <h3 className="mb-3 text-lg font-medium">Basic Input</h3>
          <div className="max-w-md space-y-4">
            <Input
              label="Email"
              placeholder="Enter your email"
              id="input-basic"
            />
            <Input
              label="Email"
              required
              placeholder="Enter your email"
              id="input-required"
            />
          </div>
        </div>

        {/* Input with Icon */}
        <div>
          <h3 className="mb-3 text-lg font-medium">Input with Icon</h3>
          <div className="max-w-md space-y-4">
            <Input
              label="ID Card"
              icon={<AddUser className="h-5 w-5" />}
              placeholder="Enter ID card number"
              id="input-icon"
            />
            <Input
              label="ID Card"
              required
              icon={<AddUser className="h-5 w-5" />}
              placeholder="Enter ID card number"
              id="input-icon-required"
            />
          </div>
        </div>

        {/* Input States */}
        <div>
          <h3 className="mb-3 text-lg font-medium">Input States</h3>
          <div className="max-w-md space-y-4">
            <Input
              label="Email"
              placeholder="Enter your email"
              id="input-rest"
            />
            <Input
              label="Email"
              error="Invalid email address"
              placeholder="Enter your email"
              id="input-error"
            />
            <Input
              label="Email"
              disabled
              placeholder="Enter your email"
              id="input-disabled"
            />
            <Input
              label="Email"
              disabled
              value="user@example.com"
              id="input-filled-disabled"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
