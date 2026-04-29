-- Harden exposed public functions flagged by the security scanner.
-- Client apps should not call SECURITY DEFINER helpers directly; trusted server code uses service_role.
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn.signature);
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', fn.signature);
  END LOOP;
END $$;

-- Ensure every public function has an immutable search_path to prevent object shadowing.
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
  END LOOP;
END $$;

-- Keep private course/resource files downloadable only by the buyer of a paid purchase.
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
