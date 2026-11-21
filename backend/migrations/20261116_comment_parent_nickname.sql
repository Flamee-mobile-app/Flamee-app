-- Resolve the parent's current nickname even when its comment is outside the loaded page.
-- Apply after 20261115_memory_conversation.sql using the reviewed migration process.
BEGIN;
CREATE OR REPLACE FUNCTION public.memory_comment_view(p_id TEXT,p_user TEXT) RETURNS JSONB
LANGUAGE sql STABLE SET search_path=public AS $$
 SELECT jsonb_build_object('id',c.id,'memory_id',c.memory_id,'parent_id',c.parent_id,
 'body',CASE WHEN c.deleted THEN '' ELSE c.body END,'deleted',c.deleted,'version',c.version,
 'created_at',c.created_at,'updated_at',c.updated_at,
 'author',jsonb_build_object('id',u.id,'full_name',u.full_name,'username',u.username),
 'parent_author',CASE WHEN p.id IS NULL THEN NULL ELSE coalesce(nullif(btrim(pu.username),''),pu.full_name) END,
 'heart_count',(SELECT count(*) FROM memory_comment_hearts h WHERE h.comment_id=c.id),
 'hearted',EXISTS(SELECT 1 FROM memory_comment_hearts h WHERE h.comment_id=c.id AND h.user_id=p_user))
 FROM memory_comments c JOIN users u ON u.id=c.author_id
 LEFT JOIN memory_comments p ON p.id=c.parent_id LEFT JOIN users pu ON pu.id=p.author_id WHERE c.id=p_id
$$;
REVOKE ALL ON FUNCTION public.memory_comment_view(TEXT,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.memory_comment_view(TEXT,TEXT) TO service_role;
COMMIT;
