// Updated: 2025-07-29 16:30:09
// Updated: 2025-07-29 16:30:06
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
