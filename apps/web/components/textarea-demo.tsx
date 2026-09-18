'use client';

import { Textarea } from '@repo/ui/textarea';
import React from 'react';

export function TextareaDemo() {
  return (
    <section className="border-surface mt-8 border-t pt-8">
      <h2 className="mb-4 text-xl font-semibold">Textarea Component</h2>

      <div className="space-y-6">
        {/* Basic Textarea */}
        <div>
          <h3 className="mb-3 text-lg font-medium">Basic Textarea</h3>
          <div className="max-w-md space-y-4">
            <Textarea
              label="Note"
              placeholder="ระบุหมายเหตุ"
              id="textarea-basic"
            />
            <Textarea
              label="Note"
              required
              placeholder="ระบุหมายเหตุ"
              id="textarea-required"
            />
          </div>
        </div>

        {/* Textarea States */}
        <div>
          <h3 className="mb-3 text-lg font-medium">Textarea States</h3>
          <div className="max-w-md space-y-4">
            <Textarea
              label="Note"
              placeholder="ระบุหมายเหตุ"
              id="textarea-rest"
            />
            <Textarea
              label="Note"
              error="Note is required"
              placeholder="ระบุหมายเหตุ"
              id="textarea-error"
            />
            <Textarea
              label="Note"
              disabled
              placeholder="ระบุหมายเหตุ"
              id="textarea-disabled"
            />
            <Textarea
              label="Note"
              disabled
              value="เนื่องจากมีการฉีกบัตรเลือกตั้ง จำนวน 4 ใบ"
              id="textarea-filled-disabled"
            />
            <Textarea
              label="Note"
              value="เนื่องจากมีการฉีกบัตรเลือกตั้ง จำนวน 4 ใบ"
              id="textarea-filled"
            />
          </div>
        </div>

        {/* Textarea with Custom Rows */}
        <div>
          <h3 className="mb-3 text-lg font-medium">Custom Rows</h3>
          <div className="max-w-md space-y-4">
            <Textarea
              label="Note (4 rows)"
              rows={4}
              placeholder="ระบุหมายเหตุ"
              id="textarea-rows-4"
            />
            <Textarea
              label="Note (6 rows)"
              rows={6}
              placeholder="ระบุหมายเหตุ"
              id="textarea-rows-6"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
