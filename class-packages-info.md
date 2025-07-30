# Class Packages Table Structure

The application now uses the existing `class_packages` table with the following structure:

## Column Information:
- `id` (uuid) - Primary key
- `name` (text) - Package name
- `description` (text) - Package description  
- `class_count` (integer) - Number of classes in the package
- `price` (numeric) - Package price
- `validity_days` (integer) - How many days the package is valid
- `class_type_restrictions` (ARRAY) - Array of allowed class types
- `is_active` (boolean) - Whether package is active
- `created_at` (timestamp with time zone) - Creation timestamp
- `updated_at` (timestamp with time zone) - Last update timestamp
- `type` (text) - Package type
- `duration` (text) - Package duration description
- `course_type` (text) - Type of course
- `is_archived` (boolean) - Whether package is archived
- `archived_at` (timestamp with time zone) - Archive timestamp

## Usage in Application:
- **Crash Course assignments** now show packages from this table instead of class types
- **Package assignments** also use this table for package selection
- Only active and non-archived packages are shown (`is_active = true AND is_archived = false`)
- Package display format: `{name} ({duration} - {class_count} classes - ₹{price})`

## No SQL changes needed:
The existing table structure is compatible with the application requirements.