import { isValidObjectId } from 'mongoose';
import { ApiError } from './api-error.js';

export function requireObject(value: unknown, fieldName: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError(400, `${fieldName} must be an object.`);
  }

  return value as Record<string, unknown>;
}

export function requireNonEmptyString(value: unknown, fieldName: string, maxLength = 500): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ApiError(400, `${fieldName} is required.`);
  }

  const trimmedValue = value.trim();
  if (trimmedValue.length > maxLength) {
    throw new ApiError(400, `${fieldName} must be at most ${maxLength} characters.`);
  }

  return trimmedValue;
}

export function requireArray(value: unknown, fieldName: string, maxLength = 100): unknown[] {
  if (!Array.isArray(value)) {
    throw new ApiError(400, `${fieldName} must be an array.`);
  }

  if (value.length > maxLength) {
    throw new ApiError(400, `${fieldName} can contain at most ${maxLength} items.`);
  }

  return value;
}

export function requireObjectId(value: unknown, fieldName = 'id'): string {
  if (typeof value !== 'string' || !isValidObjectId(value)) {
    throw new ApiError(400, `${fieldName} is not a valid identifier.`);
  }

  return value;
}
