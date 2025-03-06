-- Create a view for all participants with their campaign information
CREATE OR REPLACE VIEW participants_with_details AS
SELECT 
    cp.id,
    cp.first_name,
    cp.last_name,
    cp.email,
    cp.phone,
    cp.created_at,
    cpart.created_at as participation_date,
    c.name as campaign_name,
    qr.slug as qr_code
FROM campaign_participants cp
JOIN campaign_participations cpart ON cpart.participant_id = cp.id
JOIN campaigns c ON c.id = cpart.campaign_id
JOIN qr_codes qr ON qr.id = cpart.qr_code_id
ORDER BY cp.created_at DESC;

-- Grant access to the view
GRANT SELECT ON participants_with_details TO anon, authenticated; 