-- Create employee_closures table
CREATE TABLE IF NOT EXISTS employee_closures (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  employee_email text NOT NULL,
  date date NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(store_id, employee_email, date)
);

-- Enable RLS
ALTER TABLE employee_closures ENABLE ROW LEVEL SECURITY;

-- Create policy for service role full access
CREATE POLICY "Service role can manage employee_closures"
  ON employee_closures
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create policy for anyone to read
CREATE POLICY "Anyone can read employee_closures"
  ON employee_closures
  FOR SELECT
  USING (true);
