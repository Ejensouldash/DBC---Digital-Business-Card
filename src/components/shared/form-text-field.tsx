"use client";

import type { ComponentProps } from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { FormFieldError } from "./form-field-error";

type FormTextFieldProps<TInput extends FieldValues, TOutput> = {
  control: Control<TInput, unknown, TOutput>;
  name: Path<TInput>;
  label: string;
  description?: string;
  multiline?: boolean;
} & Omit<ComponentProps<"input">, "name" | "defaultValue" | "value">;

// Label + input + translated validation error, wired to react-hook-form.
export function FormTextField<TInput extends FieldValues, TOutput = TInput>({
  control,
  name,
  label,
  description,
  multiline = false,
  ...inputProps
}: FormTextFieldProps<TInput, TOutput>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          {multiline ? (
            <Textarea
              id={name}
              rows={4}
              aria-invalid={fieldState.invalid}
              {...field}
              value={field.value ?? ""}
            />
          ) : (
            <Input
              id={name}
              aria-invalid={fieldState.invalid}
              {...inputProps}
              {...field}
              value={field.value ?? ""}
            />
          )}
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          <FormFieldError error={fieldState.error} />
        </Field>
      )}
    />
  );
}
