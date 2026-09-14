import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/plus";

export const dynamic = "force-dynamic";

const MAX_BYTES = 1024 * 1024; // 1MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user.id)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Unsupported file type. Use PNG, JPEG, WebP, or SVG." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 1MB)." }, { status: 400 });
  }

  const path = `${crypto.randomUUID()}.${ext}`;
  const client = createServiceClient();
  const { error: uploadError } = await client.storage
    .from("badge-icons")
    .upload(path, await file.arrayBuffer(), { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data } = client.storage.from("badge-icons").getPublicUrl(path);
  return NextResponse.json({ iconUrl: data.publicUrl });
}
