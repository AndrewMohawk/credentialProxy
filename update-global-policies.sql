-- Update any existing global policies to have null credentialId
UPDATE "Policy"
SET "credentialId" = NULL
WHERE "scope" = 'GLOBAL'; 