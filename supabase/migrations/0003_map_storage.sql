insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'map-observations',
  'map-observations',
  false,
  10485760,
  array['image/png','image/jpeg','image/webp']
)
on conflict (id) do nothing;

create policy "users upload own map observations"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'map-observations'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users read own map observations"
on storage.objects for select to authenticated
using (
  bucket_id = 'map-observations'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users delete own map observations"
on storage.objects for delete to authenticated
using (
  bucket_id = 'map-observations'
  and (storage.foldername(name))[1] = auth.uid()::text
);
