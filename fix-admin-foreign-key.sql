-- Fix Foreign Key Constraint for Admin User Deletion
-- This allows admin users to be deleted by handling their created messages appropriately

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE motivational_messages 
DROP CONSTRAINT IF EXISTS motivational_messages_created_by_fkey;

-- Step 2: Add the foreign key constraint with CASCADE behavior
-- Option A: SET NULL - Sets created_by to NULL when admin is deleted (preserves messages)
ALTER TABLE motivational_messages 
ADD CONSTRAINT motivational_messages_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES admin_users(id) 
ON DELETE SET NULL;

-- Alternative Option B: CASCADE - Deletes all messages when admin is deleted
-- (Uncomment below if you prefer to delete messages when admin is deleted)
/*
ALTER TABLE motivational_messages 
ADD CONSTRAINT motivational_messages_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES admin_users(id) 
ON DELETE CASCADE;
*/

-- Step 3: Verify the constraint was updated
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
LEFT JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'motivational_messages'
    AND kcu.column_name = 'created_by';
