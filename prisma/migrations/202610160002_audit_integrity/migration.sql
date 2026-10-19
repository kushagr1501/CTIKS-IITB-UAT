CREATE FUNCTION audit_events_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Audit events are append-only';
END;
$$;

CREATE TRIGGER audit_events_immutable
BEFORE UPDATE OR DELETE ON audit_events
FOR EACH ROW EXECUTE FUNCTION audit_events_immutable();

ALTER TABLE faculty_profiles ADD CONSTRAINT faculty_display_order_nonnegative CHECK ("displayOrder" >= 0);
ALTER TABLE faculty_profiles ADD CONSTRAINT faculty_version_positive CHECK (version >= 1);
