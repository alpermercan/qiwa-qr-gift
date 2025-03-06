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
    cp.first_name,
    cp.last_name,
    cp.email,
    cp.phone
FROM qr_codes qr
LEFT JOIN campaign_participations cpart ON cpart.qr_code_id = qr.id
LEFT JOIN campaign_participants cp ON cp.id = cpart.participant_id;

-- Grant access to the view
GRANT SELECT ON qr_codes_with_participants TO anon, authenticated; 