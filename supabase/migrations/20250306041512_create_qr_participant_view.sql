-- Create a view for QR codes with participant information
CREATE OR REPLACE VIEW qr_codes_with_participants AS
SELECT 
    qr.id,
    qr.campaign_id,
    qr.slug,
    qr.is_used,
    qr.used_at,
    qr.created_at,
    qr.expires_at,
    qr.participant_id,
    cp.first_name,
    cp.last_name,
    cp.email,
    cp.phone,
    c.name as campaign_name,
    c.discount_rate,
    c.status as campaign_status
FROM qr_codes qr
LEFT JOIN campaign_participants cp ON cp.id = qr.participant_id
LEFT JOIN campaigns c ON c.id = qr.campaign_id;

-- Grant access to the view
GRANT SELECT ON qr_codes_with_participants TO anon, authenticated; 