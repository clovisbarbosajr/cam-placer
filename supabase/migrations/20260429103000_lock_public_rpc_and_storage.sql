-- Final lock-down for payment/license RPC helpers and private resource downloads.
-- These helpers are trusted backend-only operations and must not be callable from client sessions.

DO $$
BEGIN
  IF to_regprocedure('public.newera_mark_purchase_paid(text,numeric)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.newera_mark_purchase_paid(text, numeric) FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.newera_mark_purchase_paid(text, numeric) TO service_role;
    ALTER FUNCTION public.newera_mark_purchase_paid(text, numeric) SET search_path = public, pg_temp;
  END IF;

  IF to_regprocedure('public.newera_attach_license_to_purchase(uuid,text,timestamp with time zone,text)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.newera_attach_license_to_purchase(uuid, text, timestamp with time zone, text) FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.newera_attach_license_to_purchase(uuid, text, timestamp with time zone, text) TO service_role;
    ALTER FUNCTION public.newera_attach_license_to_purchase(uuid, text, timestamp with time zone, text) SET search_path = public, pg_temp;
  END IF;

  IF to_regprocedure('public.newera_user_has_active_license(uuid)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.newera_user_has_active_license(uuid) FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.newera_user_has_active_license(uuid) TO service_role;
    ALTER FUNCTION public.newera_user_has_active_license(uuid) SET search_path = public, pg_temp;
  END IF;
END $$;

DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', fn.signature);

    IF EXISTS (
      SELECT 1 FROM pg_proc p2
      WHERE p2.oid = fn.signature::oid
        AND p2.prosecdef = true
    ) THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn.signature);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn.signature);
    END IF;
  END LOOP;
END $$;

DO $$
BEGIN
  IF to_regclass('storage.objects') IS NOT NULL
     AND to_regclass('public.newera_resources') IS NOT NULL
     AND to_regclass('public.newera_purchases') IS NOT NULL THEN
    DROP POLICY IF EXISTS "newera_resources_paid_owner_download" ON storage.objects;
    CREATE POLICY "newera_resources_paid_owner_download"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'newera-resources'
        AND EXISTS (
          SELECT 1
          FROM public.newera_resources r
          JOIN public.newera_purchases p ON p.resource_id = r.id
          WHERE r.storage_path = storage.objects.name
            AND p.user_id = auth.uid()
            AND p.status = 'paid'
        )
      );
  END IF;
END $$;
