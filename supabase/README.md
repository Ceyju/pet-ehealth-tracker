# Supabase rollout

1. Back up the target project and test the migration in staging.
2. Apply `migrations/202607220001_joycare_rehaul.sql` with the Supabase CLI.
3. Set the server-only secrets from `.env.example` in the deployment environment.
4. Register `/api/telegram/webhook` with Telegram using the configured secret header.
5. Schedule the reminder dispatcher hourly and send `Authorization: Bearer $CRON_SECRET`.

The migration is additive and labels every existing vaccination as owner reported.
