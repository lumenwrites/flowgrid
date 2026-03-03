import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  return fallback
}

export function formatDate(dateString: string, pattern = 'MMM d, yyyy'): string {
  return format(parseISO(dateString), pattern)
}
