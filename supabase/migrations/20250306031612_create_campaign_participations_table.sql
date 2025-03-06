-- Drop existing table if exists
DROP TABLE IF EXISTS campaign_participations CASCADE;

-- Create campaign_participations table
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
CREATE INDEX idx_campaign_participations_qr_code_id ON campaign_participations(qr_code_id);

-- Enable RLS
ALTER TABLE campaign_participations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Campaign participations are viewable by admin"
ON campaign_participations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Campaign participations can be created by anyone"
ON campaign_participations FOR INSERT
TO anon, authenticated
WITH CHECK (true); 