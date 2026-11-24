-- Read-only diagnostics for the reported hair-tie redemption. No point/order writes.
SELECT
  NOT (pg_get_functiondef('public.reward_operation(text,text,text,text,jsonb)'::regprocedure)
    ~ 'r[.]stock[[:space:]]*<[[:space:]]*1') AS stock_requirement_removed;

SELECT u.email, w.balance, r.id AS reward_id, r.title_vi,
  r.price_points, r.active, r.stock,
  w.balance >= r.price_points AS enough_points,
  r.price_points = 100 AS matches_displayed_price,
  c.status AS couple_status,
  u.id IN (c.partner1_id, c.partner2_id) AS is_couple_member,
  (SELECT count(*) FROM public.users member
    WHERE member.id IN (c.partner1_id, c.partner2_id) AND member.couple_id = c.id) = 2
    AS both_members_connected
FROM public.users u
LEFT JOIN public.couples c ON c.id = u.couple_id
LEFT JOIN public.mission_wallets w ON w.couple_id = u.couple_id
CROSS JOIN public.mission_rewards r
WHERE lower(u.email) = 'voduchuy@gmail.com' AND r.id = 'flamee-hair-tie';
