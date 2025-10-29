-- Add template_id column to marketing_campaigns table
ALTER TABLE marketing_campaigns 
ADD COLUMN template_id uuid REFERENCES marketing_templates(id) ON DELETE SET NULL;