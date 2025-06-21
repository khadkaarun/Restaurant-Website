// Updated: 2025-07-29 16:30:22
// Updated: 2025-07-29 16:30:15
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

const NY_TIMEZONE = 'America/New_York';

export const formatToNYTime = (date: Date | string, formatStr: string = 'PPpp') => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(dateObj, NY_TIMEZONE, formatStr);
};

export const getNYTime = (date?: Date | string) => {
  const dateObj = date ? (typeof date === 'string' ? new Date(date) : date) : new Date();
  return toZonedTime(dateObj, NY_TIMEZONE);
};

export const formatNYDateTime = (date: Date | string) => {
  return formatToNYTime(date, 'MMM dd, yyyy h:mm a');
};

export const formatNYDate = (date: Date | string) => {
  return formatToNYTime(date, 'MMM dd, yyyy');
};

export const formatNYTime = (date: Date | string) => {
  return formatToNYTime(date, 'h:mm a');
};