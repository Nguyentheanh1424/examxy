/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useId } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils/cn'

interface FormFieldContextValue {
  error?: string
  formDescriptionId: string
  formItemId: string
  formMessageId: string
  name: string
}

const FormFieldContext = createContext<FormFieldContextValue | null>(null)

export function useFormField() {
  const context = useContext(FormFieldContext)
  if (!context) {
    throw new Error('useFormField must be used within <FormField>.')
  }

  return context
}

export function Form({ children, ...props }: React.FormHTMLAttributes<HTMLFormElement>) {
  return <form {...props}>{children}</form>
}

export function FormField({
  children,
  error,
  name,
}: {
  children: ReactNode
  name: string
  error?: string
}) {
  const id = useId()
  return (
    <FormFieldContext.Provider
      value={{
        error,
        formDescriptionId: `${id}-description`,
        formItemId: `${id}-item`,
        formMessageId: `${id}-message`,
        name,
      }}
    >
      {children}
    </FormFieldContext.Provider>
  )
}

export function FormItem({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { formItemId } = useFormField()
  return <div {...props} className={cn('grid gap-2', className)} id={formItemId} />
}

export function FormLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  return <Label {...props} className={cn(className)} />
}

export function FormControl({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn(className)} />
}

export function FormDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  const { formDescriptionId } = useFormField()
  return <p {...props} className={cn('text-sm leading-6 text-muted', className)} id={formDescriptionId} />
}

export function FormMessage({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  const { error, formMessageId } = useFormField()
  if (!error && !props.children) {
    return null
  }

  return <p {...props} className={cn('text-sm font-medium text-danger', className)} id={formMessageId}>{error ?? props.children}</p>
}
