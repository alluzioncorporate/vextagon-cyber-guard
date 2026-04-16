-- Update admin email from CPF-based synthetic email to real email
UPDATE auth.users
SET email = 'xdba@proton.me',
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('email', 'xdba@proton.me'),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE id = 'f2040252-35d4-4a81-b0e4-db7f5c020e3d';

-- Ensure admin role is assigned
INSERT INTO public.user_roles (user_id, role)
VALUES ('f2040252-35d4-4a81-b0e4-db7f5c020e3d', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Also ensure 'user' role
INSERT INTO public.user_roles (user_id, role)
VALUES ('f2040252-35d4-4a81-b0e4-db7f5c020e3d', 'user')
ON CONFLICT (user_id, role) DO NOTHING;