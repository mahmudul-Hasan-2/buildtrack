import "server-only";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "progress-photos";
const MAX_BYTES = 3 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function validateImages(files: File[], max = 4) {
  if (files.length > max)
    throw new Error(`You can upload at most ${max} photos`);
  for (const f of files) {
    if (!TYPES[f.type])
      throw new Error("Only JPG, PNG or WebP images are allowed");
    if (f.size > MAX_BYTES)
      throw new Error("Each photo must be 3 MB or smaller");
  }
}

export async function uploadImages(
  files: File[],
  folder: string,
): Promise<string[]> {
  if (files.length === 0) return [];
  validateImages(files);

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Photo storage is not configured");

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const urls: string[] = [];
  for (const f of files) {
    const path = `${folder}/${crypto.randomUUID()}.${TYPES[f.type]}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, await f.arrayBuffer(), { contentType: f.type });
    if (error) throw new Error("Photo upload failed");
    urls.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
  }
  return urls;
}
