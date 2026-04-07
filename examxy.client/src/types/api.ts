export interface ApiErrorResponse {
  statusCode: number
  code: string
  message: string
  traceId: string
  errors?: Record<string, string[]> | null
}

export type FieldErrors<T extends string = string> = Partial<Record<T, string>>
