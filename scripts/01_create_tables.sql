-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create enum types
CREATE TYPE pet_species AS ENUM ('dog', 'cat', 'rabbit', 'hamster', 'guinea_pig', 'bird', 'reptile', 'other');
CREATE TYPE vaccine_type AS ENUM ('core', 'non-core', 'booster');
CREATE TYPE vaccine_status AS ENUM ('pending', 'upcoming', 'overdue', 'completed');
CREATE TYPE medical_record_type AS ENUM ('checkup', 'lab_test', 'surgery', 'vaccination', 'dental', 'other');
CREATE TYPE audit_action AS ENUM ('vaccination_added', 'vaccination_updated', 'vaccination_deleted', 'record_added', 'record_deleted', 'pet_added', 'pet_updated', 'pet_deleted');

-- Create pets table
CREATE TABLE IF NOT EXISTS pets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species pet_species NOT NULL,
  breed TEXT,
  date_of_birth DATE,
  microchip_id TEXT,
  weight DECIMAL(10, 2),
  medical_notes TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create vaccinations table
CREATE TABLE IF NOT EXISTS vaccinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  vaccine_name TEXT NOT NULL,
  vaccine_type vaccine_type NOT NULL,
  date_administered DATE NOT NULL,
  next_due_date DATE,
  status vaccine_status DEFAULT 'completed',
  clinic_name TEXT,
  vet_name TEXT,
  batch_number TEXT,
  certificate_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create medical_records table
CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  record_type medical_record_type NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create audit_logs table (immutable)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  action audit_action NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_pets_user_id ON pets(user_id);
CREATE INDEX idx_vaccinations_pet_id ON vaccinations(pet_id);
CREATE INDEX idx_vaccinations_next_due_date ON vaccinations(next_due_date);
CREATE INDEX idx_vaccinations_status ON vaccinations(status);
CREATE INDEX idx_medical_records_pet_id ON medical_records(pet_id);
CREATE INDEX idx_audit_logs_pet_id ON audit_logs(pet_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for pets
CREATE POLICY "Users can view their own pets" ON pets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pets" ON pets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pets" ON pets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pets" ON pets
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for vaccinations
CREATE POLICY "Users can view vaccinations for their pets" ON vaccinations
  FOR SELECT USING (
    pet_id IN (
      SELECT id FROM pets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert vaccinations for their pets" ON vaccinations
  FOR INSERT WITH CHECK (
    pet_id IN (
      SELECT id FROM pets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update vaccinations for their pets" ON vaccinations
  FOR UPDATE USING (
    pet_id IN (
      SELECT id FROM pets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete vaccinations for their pets" ON vaccinations
  FOR DELETE USING (
    pet_id IN (
      SELECT id FROM pets WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for medical_records
CREATE POLICY "Users can view medical records for their pets" ON medical_records
  FOR SELECT USING (
    pet_id IN (
      SELECT id FROM pets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert medical records for their pets" ON medical_records
  FOR INSERT WITH CHECK (
    pet_id IN (
      SELECT id FROM pets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete medical records for their pets" ON medical_records
  FOR DELETE USING (
    pet_id IN (
      SELECT id FROM pets WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for audit_logs (append-only)
CREATE POLICY "Users can view audit logs for their pets" ON audit_logs
  FOR SELECT USING (
    pet_id IN (
      SELECT id FROM pets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert audit logs for their pets" ON audit_logs
  FOR INSERT WITH CHECK (
    pet_id IN (
      SELECT id FROM pets WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );
