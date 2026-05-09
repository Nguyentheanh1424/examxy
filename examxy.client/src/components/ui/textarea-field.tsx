import type { ReactNode, TextareaHTMLAttributes } from "react";
import { forwardRef, useId } from "react";

import { cn } from "@/lib/utils/cn";

export interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  labelAction?: ReactNode;
  hint?: string;
  error?: string;
  textareaClassName?: string;
}

export const TextareaField = forwardRef<
  HTMLTextAreaElement,
  TextareaFieldProps
>(
  (
    {
      className,
      textareaClassName,
      error,
      hint,
      id,
      label,
      labelAction,
      rows = 4,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const hintId = hint ? `${textareaId}-hint` : undefined;
    const errorId = error ? `${textareaId}-error` : undefined;
    const describedBy =
      [hintId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label
            className="block text-base font-medium tracking-[0.01em] text-ink"
            htmlFor={textareaId}
          >
            {label}
          </label>

          {labelAction ? <div className="shrink-0">{labelAction}</div> : null}
        </div>

        <textarea
          {...props}
          ref={ref}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          className={cn(
            "min-h-11 w-full rounded-[var(--radius-input)] border bg-surface px-4 py-3 text-base text-ink outline-none transition placeholder:text-muted/80 motion-reduce:transition-none",
            error
              ? "border-danger/65 bg-danger-soft/60"
              : "border-line hover:border-brand/25 focus:border-brand focus:ring-4 focus:ring-focus/25",
            textareaClassName,
          )}
          id={textareaId}
          rows={rows}
        />

        {hint ? (
          <p className="text-base leading-relaxed text-muted" id={hintId}>
            {hint}
          </p>
        ) : null}

        {error ? (
          <p
            className="text-base font-medium leading-relaxed text-danger"
            id={errorId}
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

TextareaField.displayName = "TextareaField";
