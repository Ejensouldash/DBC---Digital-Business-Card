-- Basic spam guard for the public "exchange contacts" form: at most 5 leads per profile
-- in any 10-minute window. Enforced here so it holds even if the app check is bypassed.
CREATE FUNCTION "public"."limit_lead_rate"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  -- Serialise inserts for one profile so concurrent submissions can't all pass the count.
  PERFORM pg_advisory_xact_lock(hashtextextended('leads:' || NEW.profile_id::text, 0));
  IF (
    SELECT count(*) FROM "public"."leads"
    WHERE profile_id = NEW.profile_id AND created_at > now() - interval '10 minutes'
  ) >= 5 THEN
    RAISE EXCEPTION 'lead_rate_limited' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER "leads_rate_limit" BEFORE INSERT ON "public"."leads"
  FOR EACH ROW EXECUTE FUNCTION "public"."limit_lead_rate"();
