'use server';

import { z } from 'zod';
import { appendLeadToSheet } from '@/lib/google-sheets';

// Zod schema for form validation
const leadSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address'),
    phone: z
        .string()
        .min(10, 'Phone number must be at least 10 digits')
        .regex(/^[0-9+\s()-]+$/, 'Invalid phone number format'),
    service: z.string().min(1, 'Please select a service'),
});

export type LeadFormData = z.infer<typeof leadSchema>;

export interface SubmitLeadResult {
    success: boolean;
    error?: string;
}

/**
 * Server Action: Handle lead form submission
 * Validates data and submits to Google Sheets
 */
export async function handleLeadSubmission(
    formData: FormData
): Promise<SubmitLeadResult> {
    try {
        // Extract form data
        const rawData = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            phone: formData.get('phone') as string,
            service: formData.get('service') as string,
        };

        // Validate with Zod
        const validatedData = leadSchema.parse(rawData);

        // Submit to Google Sheets
        await appendLeadToSheet(validatedData);

        return { success: true };
    } catch (error) {
        console.error('Lead submission error:', error);

        // Handle Zod validation errors
        if (error instanceof z.ZodError) {
            const firstError = error.errors[0];
            return {
                success: false,
                error: firstError.message,
            };
        }

        // Handle other errors
        return {
            success: false,
            error: 'Failed to submit form. Please try again.',
        };
    }
}
