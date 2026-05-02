import { getSupabase, requireOwner, json, err } from './_lib.js';

export default async function handler(req, res) {
  try {
    requireOwner(req);
    const b = req.body || {};
    if (!b.imageData) return json(res, { url: '' });
    const mimeType = b.mimeType || 'image/jpeg';
    const ext = mimeType.split('/')[1] || 'jpg';
    const fileName = b.fileName || `bill-${Date.now()}.${ext}`;
    const buffer = Buffer.from(b.imageData, 'base64');
    const sb = getSupabase();
    const { data, error } = await sb.storage
      .from('screenshots')
      .upload(`bills/${fileName}`, buffer, { contentType: mimeType, upsert: false });
    if (error) throw error;
    const { data: urlData } = sb.storage.from('screenshots').getPublicUrl(data.path);
    return json(res, { success: true, url: urlData.publicUrl });
  } catch (e) {
    return err(res, e.message);
  }
}
