CREATE TABLE super_ai.stripe_webhook_events (
  event_id text PRIMARY KEY CHECK (length(event_id) BETWEEN 1 AND 255),
  event_type text NOT NULL CHECK (length(event_type) BETWEEN 1 AND 255),
  livemode boolean NOT NULL,
  object_id text,
  event_created_at bigint,
  payload_sha256 text NOT NULL CHECK (payload_sha256 ~ '^[a-f0-9]{64}$'),
  processing_state text NOT NULL DEFAULT 'received'
    CHECK (processing_state IN ('received','processing','processed','failed','ignored')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  failure_code text
);

CREATE INDEX stripe_webhook_events_pending_idx
  ON super_ai.stripe_webhook_events(processing_state, received_at)
  WHERE processing_state IN ('received','failed');

-- This is a system billing inbox. Do not grant access to ordinary tenant roles.
-- A dedicated billing worker role must receive the minimum required privileges.
