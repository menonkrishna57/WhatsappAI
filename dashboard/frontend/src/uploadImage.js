import { supabase } from './auth';

/**
 * Uploads a single file to a Supabase Storage bucket and returns its public URL.
 *
 * Requires the bucket to already exist in your Supabase project with public
 * read access enabled (Storage -> Buckets -> Create bucket -> check "Public").
 * Bucket names used by this app: "product-images", "business-logos".
 */
export async function uploadImage(file, bucket, pathPrefix = '') {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${pathPrefix}${pathPrefix ? '/' : ''}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (uploadError) {
    throw new Error(`Image upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
