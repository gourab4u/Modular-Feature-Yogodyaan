-- Create packages table if it doesn't exist
-- This table stores yoga packages/courses that can be assigned to instructors

CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_weeks INTEGER NOT NULL DEFAULT 4,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    difficulty_level VARCHAR(50) DEFAULT 'beginner',
    total_classes INTEGER DEFAULT 0,
    classes_per_week INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_packages_name ON packages(name);
CREATE INDEX IF NOT EXISTS idx_packages_is_active ON packages(is_active);
CREATE INDEX IF NOT EXISTS idx_packages_difficulty ON packages(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_packages_duration ON packages(duration_weeks);

-- Insert some sample packages if the table is empty
INSERT INTO packages (name, description, duration_weeks, price, difficulty_level, total_classes, classes_per_week)
SELECT 'Beginner Yoga Package', 'Perfect for beginners starting their yoga journey', 4, 2000.00, 'beginner', 8, 2
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE name = 'Beginner Yoga Package');

INSERT INTO packages (name, description, duration_weeks, price, difficulty_level, total_classes, classes_per_week)
SELECT 'Intermediate Yoga Package', 'For those with some yoga experience', 6, 3500.00, 'intermediate', 12, 2
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE name = 'Intermediate Yoga Package');

INSERT INTO packages (name, description, duration_weeks, price, difficulty_level, total_classes, classes_per_week)
SELECT 'Advanced Yoga Package', 'Advanced practices for experienced yogis', 8, 5000.00, 'advanced', 16, 2
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE name = 'Advanced Yoga Package');

INSERT INTO packages (name, description, duration_weeks, price, difficulty_level, total_classes, classes_per_week)
SELECT 'Corporate Wellness Package', 'Yoga for workplace wellness programs', 12, 8000.00, 'beginner', 24, 2
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE name = 'Corporate Wellness Package');

INSERT INTO packages (name, description, duration_weeks, price, difficulty_level, total_classes, classes_per_week)
SELECT 'Prenatal Yoga Package', 'Safe yoga practices for expecting mothers', 10, 4500.00, 'beginner', 20, 2
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE name = 'Prenatal Yoga Package');