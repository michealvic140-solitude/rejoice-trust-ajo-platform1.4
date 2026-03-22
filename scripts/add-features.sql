-- Add trust_score column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 50;

-- Add image_url and video_url to announcements table if they don't exist  
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Create seat_removal_requests table for users to request seat removal
CREATE TABLE IF NOT EXISTS seat_removal_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  seat_number INTEGER NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  admin_response TEXT,
  responded_at TIMESTAMP,
  UNIQUE(user_id, group_id, seat_number)
);

-- Create contact_info table if it doesn't exist
CREATE TABLE IF NOT EXISTS contact_info (
  id SERIAL PRIMARY KEY UNIQUE,
  whatsapp VARCHAR(255),
  facebook VARCHAR(255),
  email VARCHAR(255),
  call_number VARCHAR(20),
  sms_number VARCHAR(20),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default contact info if not exists
INSERT INTO contact_info (id, whatsapp, facebook, email, call_number, sms_number)
VALUES (1, '', '', '', '', '')
ON CONFLICT (id) DO NOTHING;
