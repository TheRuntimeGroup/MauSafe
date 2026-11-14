import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const BUCKET = "community-media";
const IMAGE_LIMIT = 8 * 1024 * 1024;
const VIDEO_LIMIT = 40 * 1024 * 1024;

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function validImage(bytes: Uint8Array, mime: string): boolean {
  if (mime === "image/png") {
    const signature = [137, 80, 78, 71, 13, 10, 26, 10];
    return bytes.length >= signature.length && signature.every((value, index) => bytes[index] === value);
  }
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function validMp4(bytes: Uint8Array): boolean {
  return bytes.length >= 16
    && String.fromCharCode(...bytes.subarray(4, 8)) === "ftyp";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ error: "UNAUTHORIZED" }, 401);
    const token = authorization.slice(7).trim();
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return json({ error: "UNAUTHORIZED" }, 401);

    const formData = await req.formData();
    const attachment = formData.get("file");
    if (!(attachment instanceof File)) return json({ error: "FILE_REQUIRED" }, 400);

    const type = attachment.type;
    const extension = type === "image/png" ? "png" : type === "image/jpeg" ? "jpg" : type === "video/mp4" ? "mp4" : null;
    if (!extension || !/\.(png|jpe?g|mp4)$/i.test(attachment.name)) {
      return json({ error: "UNSUPPORTED_FILE" }, 400);
    }

    const sizeLimit = extension === "mp4" ? VIDEO_LIMIT : IMAGE_LIMIT;
    if (attachment.size <= 0 || attachment.size > sizeLimit) {
      return json({ error: extension === "mp4" ? "VIDEO_TOO_LARGE" : "IMAGE_TOO_LARGE" }, 400);
    }

    const bytes = new Uint8Array(await attachment.arrayBuffer());
    const validContent = extension === "mp4" ? validMp4(bytes) : validImage(bytes, type);
    if (!validContent) return json({ error: "INVALID_FILE_CONTENT" }, 400);

    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, bytes, {
      contentType: type,
      upsert: false,
      cacheControl: "3600",
    });
    if (uploadError) {
      console.error("[upload-community-media] storage upload failed", uploadError);
      return json({ error: "UPLOAD_FAILED" }, 500);
    }

    const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
    return json({
      ok: true,
      url: data.publicUrl,
      type: extension === "mp4" ? "video" : "image",
      name: attachment.name,
    });
  } catch (error) {
    console.error("[upload-community-media] unexpected error", error);
    return json({ error: "UPLOAD_FAILED" }, 500);
  }
});
