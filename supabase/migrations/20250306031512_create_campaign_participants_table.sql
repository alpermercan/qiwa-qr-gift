-- Drop existing table if exists
DROP TABLE IF EXISTS campaign_participants CASCADE;

-- Create campaign_participants table
CREATE TABLE campaign_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add indexes
CREATE INDEX idx_campaign_participants_email ON campaign_participants(email);
CREATE INDEX idx_campaign_participants_phone ON campaign_participants(phone);

-- Enable RLS
ALTER TABLE campaign_participants ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Campaign participants are viewable by admin"
ON campaign_participants FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Campaign participants can be created by anyone"
ON campaign_participants FOR INSERT
TO anon, authenticated
WITH CHECK (true); 