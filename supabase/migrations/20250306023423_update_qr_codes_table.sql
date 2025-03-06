-- Drop existing qr_codes table and recreate it with the correct schema
DROP TABLE IF EXISTS qr_codes CASCADE;

CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Add indexes
CREATE INDEX idx_qr_codes_campaign_id ON qr_codes(campaign_id);
CREATE INDEX idx_qr_codes_slug ON qr_codes(slug);

-- Add RLS policies
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "QR codes are viewable by admin" ON qr_codes
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "QR codes can be viewed by anyone with valid slug" ON qr_codes
    FOR SELECT TO anon
    USING (NOT is_used AND TIMEZONE('utc', NOW()) < expires_at);

CREATE POLICY "QR codes can be created by anyone" ON qr_codes
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "QR codes can be updated by anyone" ON qr_codes
    FOR UPDATE
    USING (true)
    WITH CHECK (true);
