import { forwardRef } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// §1.8 Inputs (.ms-input)
const inputBase =
  "w-full rounded-control border border-border px-[14px] py-3 font-sans text-body text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:border-primary transition-colors";

interface FieldWrapperProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  helperText?: string;
  rightElement?: React.ReactNode;
  children: React.ReactNode;
}

export function FieldWrapper({ label, htmlFor, error, helperText, rightElement, children }: FieldWrapperProps) {
  return (
    <div className="w-full">
      {label && (
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor={htmlFor} className="text-label text-charcoal">
            {label}
          </label>
          {rightElement}
        </div>
      )}
      {children}
      {error && <p className="mt-1.5 text-micro text-danger">{error}</p>}
      {!error && helperText && <p className="mt-1.5 text-micro text-charcoal/56">{helperText}</p>}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helperText?: string;
  rightElement?: React.ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, rightElement, className, id, ...props }, ref) => (
    <FieldWrapper label={label} htmlFor={id} error={error} helperText={helperText} rightElement={rightElement}>
      <input
        ref={ref}
        id={id}
        className={cn(inputBase, error && "border-danger", className)}
        {...props}
      />
    </FieldWrapper>
  )
);
Input.displayName = "Input";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  helperText?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => (
    <FieldWrapper label={label} htmlFor={id} error={error} helperText={helperText}>
      <textarea
        ref={ref}
        id={id}
        className={cn(inputBase, "min-h-[96px] resize-y", error && "border-danger", className)}
        {...props}
      />
    </FieldWrapper>
  )
);
Textarea.displayName = "Textarea";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  helperText?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, className, id, children, ...props }, ref) => (
    <FieldWrapper label={label} htmlFor={id} error={error} helperText={helperText}>
      <select
        ref={ref}
        id={id}
        className={cn(inputBase, "bg-white appearance-none cursor-pointer", error && "border-danger", className)}
        {...props}
      >
        {children}
      </select>
    </FieldWrapper>
  )
);
Select.displayName = "Select";
