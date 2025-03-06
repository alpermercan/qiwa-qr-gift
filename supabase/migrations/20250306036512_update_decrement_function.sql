-- Drop existing function
DROP FUNCTION IF EXISTS decrement_campaign_uses;

-- Create function with better error handling
CREATE OR REPLACE FUNCTION decrement_campaign_uses(campaign_id UUID)
RETURNS json AS $$
DECLARE
    campaign_record RECORD;
    result json;
BEGIN
    -- Get current campaign state
    SELECT * INTO campaign_record
    FROM campaigns
    WHERE id = campaign_id
    FOR UPDATE;  -- Lock the row

    -- Check if campaign exists
    IF NOT FOUND THEN
        result := json_build_object(
            'success', false,
            'error', 'Campaign not found'
        );
        RETURN result;
    END IF;

    -- Check if campaign has remaining uses
    IF campaign_record.remaining_uses <= 0 THEN
        result := json_build_object(
            'success', false,
            'error', 'No remaining uses'
        );
        RETURN result;
    END IF;

    -- Update campaign
    UPDATE campaigns
    SET 
        remaining_uses = remaining_uses - 1,
        status = CASE 
            WHEN remaining_uses - 1 <= 0 THEN 'depleted'
            ELSE status
        END
    WHERE id = campaign_id
    AND remaining_uses > 0;

    -- Get affected rows
    GET DIAGNOSTICS result := ROW_COUNT;
    
    IF result::int > 0 THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Campaign updated successfully'
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to update campaign'
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