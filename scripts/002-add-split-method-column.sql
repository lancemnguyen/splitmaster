-- Add split_method and split_config columns to expenses table to store how the expense was originally split
ALTER TABLE expenses 
ADD COLUMN split_method VARCHAR(20) DEFAULT 'equal',
ADD COLUMN split_config JSONB DEFAULT '{}';

-- Update existing expenses to have split_method as 'equal'
UPDATE expenses SET split_method = 'equal' WHERE split_method IS NULL;