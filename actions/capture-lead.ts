'use server';

import { z } from 'zod';
import { appendLeadToSheet } from '@/lib/google-sheets';

// Zod schema for lead validation
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

export interface CaptureLeadResult {
    success: boolean;
    error?: string;
}

/**
 * Server Action: Capture lead and save to Google Sheets
 * Validates form data and calls appendLeadToSheet
 * Does NOT handle redirect - client will handle navigation for smoother UX
 */
export async function captureLead(
    formData: FormData
): Promise<CaptureLeadResult> {
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

        // Append to Google Sheets
        await appendLeadToSheet(validatedData);

        // Return success - client will handle redirect
        return { success: true };
    } catch (error) {
        console.error('Lead capture error:', error);

        // Handle Zod validation errors
        if (error instanceof z.ZodError) {
            const firstError = error.issues[0];
            console.error('Zod validation error:', firstError.message);
            return {
                success: false,
                error: firstError.message,
            };
        }

        // Handle other errors (e.g., Google Sheets API errors)
        console.error('Non-validation error:', error);
        return {
            success: false,
            error: 'Failed to submit form. Please try again.',
        };
    }
}
