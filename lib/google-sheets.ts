import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

export interface LeadData {
    name: string;
    email: string;
    phone: string;
    service: string;
}

/**
 * Append lead data to Google Sheets
 * Uses google-auth-library for authentication with JWT credentials from environment variables
 */
export async function appendLeadToSheet(data: LeadData): Promise<void> {
    try {
        const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY;
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        if (!clientEmail || !privateKey || !spreadsheetId) {
            throw new Error(
                'Missing Google Sheets credentials. Ensure GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, and GOOGLE_SHEET_ID are set in .env.local'
            );
        }

        // Crucial: Handle escaped newlines in private key
        // Environment variables often store \n as literal string "\\n"
        const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

        // Initialize Google Auth with JWT
        const auth = new GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: formattedPrivateKey,
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        // Create Google Sheets client
        const sheets = google.sheets({ version: 'v4', auth });

        // Format current date/time in IST
        const timestamp = new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });

        // Map data to columns: Date, Name, Email, Phone, Service, Status
        const values = [
            [
                timestamp,
                data.name,
                data.email,
                data.phone,
                data.service,
                'New', // Default status for new leads
            ],
        ];

        // Append row to sheet
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'A:F', // Columns A through F (Date, Name, Email, Phone, Service, Status)
            valueInputOption: 'RAW',
            requestBody: {
                values,
            },
        });

        console.log('✅ Lead successfully appended to Google Sheets:', data.email);
    } catch (error) {
        console.error('❌ Error appending lead to Google Sheets:', error);
        throw new Error('Failed to save lead to Google Sheets');
    }
}
