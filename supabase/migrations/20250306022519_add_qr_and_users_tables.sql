-- Drop existing tables if they conflict with our new schema
DROP TABLE IF EXISTS campaign_claims CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create campaign participants table first
CREATE TABLE campaign_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create QR codes table if not exists
CREATE TABLE IF NOT EXISTS qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create campaign participations table last (since it references both other tables)
CREATE TABLE campaign_participations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES campaign_participants(id) ON DELETE CASCADE,
    qr_code_id UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(campaign_id, participant_id),
    UNIQUE(qr_code_id)
);

-- Add indexes
CREATE INDEX idx_campaign_participations_campaign_id ON campaign_participations(campaign_id);
CREATE INDEX idx_campaign_participations_participant_id ON campaign_participations(participant_id);
CREATE INDEX idx_campaign_participants_email ON campaign_participants(email);
CREATE INDEX idx_campaign_participants_phone ON campaign_participants(phone);

-- Add RLS (Row Level Security) policies
ALTER TABLE campaign_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_participations ENABLE ROW LEVEL SECURITY;

-- Create policies for campaign_participants table
CREATE POLICY "Campaign participants are viewable by admin" ON campaign_participants
    FOR SELECT TO authenticated
    USING (auth.role() = 'admin');

CREATE POLICY "Campaign participants can be created by anyone" ON campaign_participants
    FOR INSERT TO anon
    WITH CHECK (true);

-- Create policies for campaign_participations table
CREATE POLICY "Campaign participations are viewable by admin" ON campaign_participations
    FOR SELECT TO authenticated
    USING (auth.role() = 'admin');

CREATE POLICY "Campaign participations can be created by anyone" ON campaign_participations
    FOR INSERT TO anon
    WITH CHECK (true);
