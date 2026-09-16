-- Migration: Create clients table and auto-create client trigger
-- Run this in your Supabase SQL Editor

-- 1. Create the clients table
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    client_id VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Populate clients table with distinct client names from financial_ledger
INSERT INTO clients (client_id, name)
SELECT 
    'CLI-' || LPAD(row_num::TEXT, 4, '0') as client_id,
    client_name
FROM (
    SELECT DISTINCT client_name,
           ROW_NUMBER() OVER (ORDER BY client_name) as row_num
    FROM financial_ledger 
    WHERE client_name IS NOT NULL AND TRIM(client_name) <> ''
) t
ON CONFLICT (name) DO NOTHING;

-- 3. Create the auto-create client trigger function
CREATE OR REPLACE FUNCTION auto_create_client()
RETURNS TRIGGER AS $$
DECLARE
    client_exists BOOLEAN;
    next_num INT;
    new_client_id VARCHAR(100);
    trimmed_name VARCHAR(255);
BEGIN
    IF NEW.client_name IS NOT NULL THEN
        trimmed_name := TRIM(NEW.client_name);
        IF trimmed_name <> '' THEN
            -- Check if client already exists (case-insensitive check)
            SELECT EXISTS (
                SELECT 1 FROM clients WHERE LOWER(name) = LOWER(trimmed_name)
            ) INTO client_exists;
            
            IF NOT client_exists THEN
                -- Calculate next incremental CLI ID
                SELECT COALESCE(MAX(SUBSTRING(client_id FROM 5)::INTEGER), 0) + 1
                INTO next_num
                FROM clients
                WHERE client_id LIKE 'CLI-%';
                
                new_client_id := 'CLI-' || LPAD(next_num::TEXT, 4, '0');
                
                INSERT INTO clients (client_id, name)
                VALUES (new_client_id, trimmed_name)
                ON CONFLICT (name) DO NOTHING;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach the trigger to financial_ledger
DROP TRIGGER IF EXISTS trg_auto_create_client ON financial_ledger;
CREATE TRIGGER trg_auto_create_client
BEFORE INSERT OR UPDATE ON financial_ledger
FOR EACH ROW
EXECUTE FUNCTION auto_create_client();
