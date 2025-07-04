-- Check the structure of student_help_confirmations table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'student_help_confirmations' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check foreign key constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'student_help_confirmations'
AND tc.table_schema = 'public';

-- Check if the users table exists and has the expected structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
AND column_name IN ('id', 'first_name', 'last_name')
ORDER BY ordinal_position; 