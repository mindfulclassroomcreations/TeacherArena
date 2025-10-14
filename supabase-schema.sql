-- Create the product_ideas table in your Supabase database
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS product_ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_title TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  standards TEXT NOT NULL,
  notes TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create an index on created_at for faster queries
CREATE INDEX IF NOT EXISTS idx_product_ideas_created_at ON product_ideas(created_at DESC);

-- Create an index on grade_level for filtering
CREATE INDEX IF NOT EXISTS idx_product_ideas_grade_level ON product_ideas(grade_level);

-- Create an index on category for filtering
CREATE INDEX IF NOT EXISTS idx_product_ideas_category ON product_ideas(category);

-- Enable Row Level Security (RLS)
ALTER TABLE product_ideas ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (you can customize this based on your auth setup)
CREATE POLICY "Allow all operations on product_ideas" ON product_ideas
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- If you want to restrict access to authenticated users only, use this policy instead:
-- CREATE POLICY "Allow authenticated users" ON product_ideas
--   FOR ALL
--   USING (auth.role() = 'authenticated')
--   WITH CHECK (auth.role() = 'authenticated');
