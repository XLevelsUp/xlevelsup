'use server';

import { z } from 'zod';
import { appendLeadToSheet } from '@/lib/google-sheets';

// Zod schema for email-only lead validation
const emailLeadSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export interface CaptureEmailResult {
    success: boolean;
    error?: string;
}

/**
 * Server Action: Capture email-only lead and save to Google Sheets
 * Saves with empty fields for name, phone, service and 'New' status
 */
export async function captureEmailLead(
    formData: FormData
): Promise<CaptureEmailResult> {
    try {
        // Extract email from form data
        const rawData = {
            email: formData.get('email') as string,
        };

        // Validate with Zod
        const validatedData = emailLeadSchema.parse(rawData);

        // Append to Google Sheets with empty fields
        await appendLeadToSheet({
            name: '', // Empty
            email: validatedData.email,
            phone: '', // Empty
            service: '', // Empty
        });

        // Return success - client will handle redirect
        return { success: true };
    } catch (error) {
        console.error('Email lead capture error:', error);

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
            error: 'Failed to submit email. Please try again.',
        };
    }
}
