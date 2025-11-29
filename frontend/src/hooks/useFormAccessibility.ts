import { useState, useCallback, useMemo } from 'react';

interface FormFieldAccessibility {
  /**
   * Props to spread on the form field (input, textarea, select, etc.)
   */
  fieldProps: {
    'aria-invalid'?: true;
    'aria-describedby'?: string;
  };
  /**
   * Props to spread on the error message element
   */
  errorProps: {
    id: string;
    role: 'alert';
    'aria-live': 'polite';
  };
  /**
   * Current error message (null if no error)
   */
  error: string | null;
  /**
   * Set or clear the error message
   */
  setError: (error: string | null) => void;
  /**
   * Clear the error (convenience method)
   */
  clearError: () => void;
  /**
   * Check if field has an error
   */
  hasError: boolean;
}

/**
 * Hook for managing form field accessibility with ARIA attributes
 *
 * Provides standardized ARIA patterns for form validation:
 * - aria-invalid on fields with errors
 * - aria-describedby linking fields to error messages
 * - role="alert" and aria-live="polite" for error announcements
 *
 * @example
 * ```tsx
 * const emailA11y = useFormAccessibility('email');
 *
 * return (
 *   <>
 *     <input
 *       id="email"
 *       {...emailA11y.fieldProps}
 *       onChange={(e) => {
 *         if (!isValidEmail(e.target.value)) {
 *           emailA11y.setError('Please enter a valid email address');
 *         } else {
 *           emailA11y.clearError();
 *         }
 *       }}
 *     />
 *     {emailA11y.hasError && (
 *       <span {...emailA11y.errorProps}>{emailA11y.error}</span>
 *     )}
 *   </>
 * );
 * ```
 */
export function useFormAccessibility(fieldId: string): FormFieldAccessibility {
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const hasError = error !== null;

  const fieldProps = useMemo(
    () => ({
      'aria-invalid': hasError ? (true as const) : undefined,
      'aria-describedby': hasError ? `${fieldId}-error` : undefined,
    }),
    [fieldId, hasError]
  );

  const errorProps = useMemo(
    () => ({
      id: `${fieldId}-error`,
      role: 'alert' as const,
      'aria-live': 'polite' as const,
    }),
    [fieldId]
  );

  return {
    fieldProps,
    errorProps,
    error,
    setError,
    clearError,
    hasError,
  };
}

/**
 * Hook for managing multiple form fields' accessibility
 *
 * @example
 * ```tsx
 * const form = useFormFieldsAccessibility(['name', 'email', 'password']);
 *
 * return (
 *   <>
 *     <input id="name" {...form.name.fieldProps} />
 *     {form.name.hasError && <span {...form.name.errorProps}>{form.name.error}</span>}
 *
 *     <input id="email" {...form.email.fieldProps} />
 *     {form.email.hasError && <span {...form.email.errorProps}>{form.email.error}</span>}
 *   </>
 * );
 * ```
 */
export function useFormFieldsAccessibility<T extends string>(
  fieldIds: T[]
): Record<T, FormFieldAccessibility> {
  const fields = fieldIds.reduce(
    (acc, id) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      acc[id] = useFormAccessibility(id);
      return acc;
    },
    {} as Record<T, FormFieldAccessibility>
  );

  return fields;
}
