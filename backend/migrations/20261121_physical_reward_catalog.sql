-- Initial physical reward catalog requested for the milestone storefront.
-- Zero means no stock allocated for redemption, NOT an assertion of warehouse stock.
-- Does not create orders, change points or invent a contact URL.
BEGIN;
ALTER TABLE public.mission_rewards ALTER COLUMN fanpage_url DROP NOT NULL;
INSERT INTO public.mission_rewards
  (id, title_vi, title_en, description_vi, description_en, price_points, stock, fanpage_url, active)
VALUES
  ('flamee-hair-tie', 'Dây buộc tóc', 'Hair tie', 'Một món quà nhỏ cho những ngày bên nhau.', 'A little gift for your days together.', 100, 0, NULL, true),
  ('flamee-love-cards', 'Bộ thiệp yêu thương', 'Love note cards', 'Gửi nhau những lời yêu thương viết tay.', 'Share a few handwritten words of love.', 500, 0, NULL, true),
  ('flamee-couple-keychains', 'Móc khóa couple', 'Couple keychains', 'Một cặp móc khóa dành cho hai bạn.', 'A pair of keychains for the two of you.', 800, 0, NULL, true),
  ('flamee-couple-mugs', 'Cốc đôi', 'Matching mugs', 'Một cặp cốc cho những phút giây cùng nhau.', 'Matching mugs for your shared moments.', 1500, 0, NULL, true),
  ('flamee-tote', 'Túi vải Flamee', 'Flamee tote bag', 'Mang một chút Flamee theo bạn mỗi ngày.', 'Take a little Flamee along every day.', 2000, 0, NULL, true)
ON CONFLICT (id) DO NOTHING;
COMMIT;
NOTIFY pgrst, 'reload schema';
