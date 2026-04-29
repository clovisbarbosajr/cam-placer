-- Lock down payment/license SECURITY DEFINER RPCs so clients cannot call them directly.
-- They remain callable by trusted server-side code using the service role.
DO $$
BEGIN
  IF to_regprocedure('public.newera_mark_purchase_paid(text,numeric)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.newera_mark_purchase_paid(text, numeric) FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.newera_mark_purchase_paid(text, numeric) TO service_role;
    ALTER FUNCTION public.newera_mark_purchase_paid(text, numeric) SET search_path = public;
  END IF;

  IF to_regprocedure('public.newera_attach_license_to_purchase(uuid,text,timestamp with time zone,text)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.newera_attach_license_to_purchase(uuid, text, timestamp with time zone, text) FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.newera_attach_license_to_purchase(uuid, text, timestamp with time zone, text) TO service_role;
    ALTER FUNCTION public.newera_attach_license_to_purchase(uuid, text, timestamp with time zone, text) SET search_path = public;
  END IF;

  IF to_regprocedure('public.newera_user_has_active_license(uuid)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.newera_user_has_active_license(uuid) FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.newera_user_has_active_license(uuid) TO service_role;
    ALTER FUNCTION public.newera_user_has_active_license(uuid) SET search_path = public;
  END IF;
END $$;

-- Only allow resource downloads for the signed-in owner of a paid purchase.
-- The policy is created conditionally so projects without this legacy schema still migrate cleanly.
DO $$
BEGIN
  IF to_regclass('storage.objects') IS NOT NULL
     AND to_regclass('public.newera_resources') IS NOT NULL
     AND to_regclass('public.newera_purchases') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'newera_resources' AND column_name = 'storage_path'
     )
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'newera_purchases' AND column_name = 'resource_id'
     )
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'newera_purchases' AND column_name = 'user_id'
     )
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'newera_purchases' AND column_name = 'status'
     ) THEN
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
