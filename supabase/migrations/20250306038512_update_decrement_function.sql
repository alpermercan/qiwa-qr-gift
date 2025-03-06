-- Drop existing function
DROP FUNCTION IF EXISTS decrement_campaign_uses;

-- Create function with better error handling
CREATE OR REPLACE FUNCTION decrement_campaign_uses(campaign_id UUID)
RETURNS json AS $$
DECLARE
    campaign_record RECORD;
    result json;
BEGIN
    -- Get current campaign state with row lock
    SELECT * INTO campaign_record
    FROM campaigns
    WHERE id = campaign_id
    FOR UPDATE;

    -- Check if campaign exists
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Kampanya bulunamadı'
        );
    END IF;

    -- Check campaign status
    IF campaign_record.status != 'active' THEN
        RETURN json_build_object(
            'success', false,
            'error', CASE 
                WHEN campaign_record.status = 'depleted' THEN 'Kampanya kullanım limiti doldu'
                WHEN campaign_record.status = 'expired' THEN 'Kampanyanın süresi doldu'
                ELSE 'Kampanya aktif değil'
            END
        );
    END IF;

    -- Check remaining uses
    IF campaign_record.remaining_uses <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Kampanya kullanım limiti doldu'
        );
    END IF;

    -- Update campaign
    UPDATE campaigns
    SET 
        remaining_uses = remaining_uses - 1,
        status = CASE 
            WHEN remaining_uses - 1 <= 0 THEN 'depleted'
            ELSE status
        END,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = campaign_id
    AND remaining_uses > 0
    AND status = 'active';

    -- Get affected rows
    GET DIAGNOSTICS result := ROW_COUNT;
    
    IF result::int > 0 THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Kampanya başarıyla güncellendi',
            'remaining_uses', campaign_record.remaining_uses - 1
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'error', 'Kampanya güncellenemedi'
        );
    END IF;

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'detail', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql; 