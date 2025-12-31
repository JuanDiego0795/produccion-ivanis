-- =====================================================
-- PRODUCCION IVANIS - DATABASE SCHEMA
-- =====================================================
-- Execute this SQL in Supabase SQL Editor
-- =====================================================

-- Create custom types (enums)
CREATE TYPE user_role AS ENUM ('admin', 'employee', 'viewer');
CREATE TYPE pig_status AS ENUM ('active', 'sold', 'deceased');
CREATE TYPE pig_sex AS ENUM ('male', 'female', 'unknown');
CREATE TYPE expense_type AS ENUM (
  'food',
  'vaccine',
  'medicine',
  'veterinary',
  'transport',
  'facilities',
  'personnel',
  'utilities',
  'other'
);

-- =====================================================
-- TABLE: profiles
-- User profiles linked to auth.users
-- =====================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'viewer',
  avatar_url TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLE: clients
-- Customer information for pig sales
-- =====================================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  tax_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLE: pigs
-- Main pig inventory table
-- =====================================================
CREATE TABLE pigs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT,
  purchase_date DATE NOT NULL,
  purchase_price DECIMAL(10,2) NOT NULL,
  purchase_weight DECIMAL(6,2),
  current_weight DECIMAL(6,2),
  breed TEXT,
  sex pig_sex DEFAULT 'unknown',
  age_months INTEGER,
  pen_location TEXT,
  status pig_status NOT NULL DEFAULT 'active',
  sale_date DATE,
  sale_price DECIMAL(10,2),
  sale_weight DECIMAL(6,2),
  death_date DATE,
  death_reason TEXT,
  notes TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLE: expenses
-- Expense tracking for pigs and general operations
-- =====================================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pig_id UUID REFERENCES pigs(id) ON DELETE SET NULL,
  type expense_type NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  invoice_number TEXT,
  supplier TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLE: vaccinations
-- Vaccination records for pigs
-- =====================================================
CREATE TABLE vaccinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pig_id UUID REFERENCES pigs(id) ON DELETE CASCADE,
  vaccine_name TEXT NOT NULL,
  application_date DATE NOT NULL,
  next_dose_date DATE,
  dose_number INTEGER NOT NULL DEFAULT 1,
  administered_by TEXT NOT NULL,
  notes TEXT,
  reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLE: vaccination_schedules
-- Vaccination calendar templates
-- =====================================================
CREATE TABLE vaccination_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaccine_name TEXT NOT NULL,
  description TEXT NOT NULL,
  dose_interval_days INTEGER NOT NULL,
  total_doses INTEGER NOT NULL DEFAULT 1,
  reminder_days_before INTEGER NOT NULL DEFAULT 3,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLE: weight_records
-- Weight history for pigs
-- =====================================================
CREATE TABLE weight_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pig_id UUID NOT NULL REFERENCES pigs(id) ON DELETE CASCADE,
  weight DECIMAL(6,2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES for better query performance
-- =====================================================
CREATE INDEX idx_pigs_status ON pigs(status);
CREATE INDEX idx_pigs_purchase_date ON pigs(purchase_date);
CREATE INDEX idx_pigs_created_by ON pigs(created_by);
CREATE INDEX idx_expenses_pig_id ON expenses(pig_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_type ON expenses(type);
CREATE INDEX idx_vaccinations_pig_id ON vaccinations(pig_id);
CREATE INDEX idx_vaccinations_next_dose_date ON vaccinations(next_dose_date);
CREATE INDEX idx_weight_records_pig_id ON weight_records(pig_id);

-- =====================================================
-- TRIGGERS for updated_at columns
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pigs_updated_at
  BEFORE UPDATE ON pigs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Auto-create profile on user signup
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'viewer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccination_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_records ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Users can view all profiles (for team collaboration)
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- PIGS POLICIES
-- =====================================================

-- All authenticated users can view pigs
CREATE POLICY "Authenticated users can view pigs"
  ON pigs FOR SELECT
  TO authenticated
  USING (true);

-- Admins and employees can insert pigs
CREATE POLICY "Admins and employees can insert pigs"
  ON pigs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'employee')
    )
  );

-- Admins and employees can update pigs
CREATE POLICY "Admins and employees can update pigs"
  ON pigs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'employee')
    )
  );

-- Only admins can delete pigs
CREATE POLICY "Admins can delete pigs"
  ON pigs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- EXPENSES POLICIES
-- =====================================================

-- All authenticated users can view expenses
CREATE POLICY "Authenticated users can view expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (true);

-- Admins and employees can insert expenses
CREATE POLICY "Admins and employees can insert expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'employee')
    )
  );

-- Admins and employees can update expenses
CREATE POLICY "Admins and employees can update expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'employee')
    )
  );

-- Only admins can delete expenses
CREATE POLICY "Admins can delete expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- VACCINATIONS POLICIES
-- =====================================================

-- All authenticated users can view vaccinations
CREATE POLICY "Authenticated users can view vaccinations"
  ON vaccinations FOR SELECT
  TO authenticated
  USING (true);

-- Admins and employees can insert vaccinations
CREATE POLICY "Admins and employees can insert vaccinations"
  ON vaccinations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'employee')
    )
  );

-- Admins and employees can update vaccinations
CREATE POLICY "Admins and employees can update vaccinations"
  ON vaccinations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'employee')
    )
  );

-- Only admins can delete vaccinations
CREATE POLICY "Admins can delete vaccinations"
  ON vaccinations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- VACCINATION_SCHEDULES POLICIES
-- =====================================================

-- All authenticated users can view schedules
CREATE POLICY "Authenticated users can view vaccination schedules"
  ON vaccination_schedules FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage schedules
CREATE POLICY "Admins can manage vaccination schedules"
  ON vaccination_schedules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- CLIENTS POLICIES
-- =====================================================

-- All authenticated users can view clients
CREATE POLICY "Authenticated users can view clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

-- Admins and employees can manage clients
CREATE POLICY "Admins and employees can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'employee')
    )
  );

CREATE POLICY "Admins and employees can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'employee')
    )
  );

CREATE POLICY "Admins can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- WEIGHT_RECORDS POLICIES
-- =====================================================

-- All authenticated users can view weight records
CREATE POLICY "Authenticated users can view weight records"
  ON weight_records FOR SELECT
  TO authenticated
  USING (true);

-- Admins and employees can insert weight records
CREATE POLICY "Admins and employees can insert weight records"
  ON weight_records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'employee')
    )
  );

-- Admins and employees can update weight records
CREATE POLICY "Admins and employees can update weight records"
  ON weight_records FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'employee')
    )
  );

-- Only admins can delete weight records
CREATE POLICY "Admins can delete weight records"
  ON weight_records FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- INITIAL VACCINATION SCHEDULES (Common pig vaccines)
-- =====================================================
INSERT INTO vaccination_schedules (vaccine_name, description, dose_interval_days, total_doses, reminder_days_before) VALUES
  ('Mycoplasma', 'Vacuna contra Mycoplasma hyopneumoniae', 21, 2, 3),
  ('Circovirus', 'Vacuna contra PCV2 (Circovirus porcino tipo 2)', 28, 2, 3),
  ('Peste Porcina', 'Vacuna contra Peste Porcina Clasica', 60, 1, 5),
  ('Erisipela', 'Vacuna contra Erisipela porcina', 30, 2, 3),
  ('Leptospirosis', 'Vacuna contra Leptospirosis', 14, 2, 3),
  ('Parvovirus', 'Vacuna contra Parvovirus porcino', 21, 2, 3),
  ('E. Coli', 'Vacuna contra diarrea por E. Coli', 14, 2, 3),
  ('Desparasitacion', 'Tratamiento antiparasitario', 30, 3, 5);
