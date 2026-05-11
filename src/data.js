import { supabase } from './supabase';

const PHOTOS_BUCKET = 'photos';

function normalize(row) {
  return {
    id: row.id,
    apartment: row.apartment,
    title: row.title,
    description: row.description || '',
    photoUrl: row.photo_url,
    status: row.status,
    deadline: row.deadline,
    managementNote: row.management_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listRequests() {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('listRequests error:', error);
    throw error;
  }
  return (data || []).map(normalize);
}

export async function createRequest({ apartment, title, description, photoBlob }) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let photoUrl = null;

  if (photoBlob) {
    const fileName = `${id}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from(PHOTOS_BUCKET)
      .upload(fileName, photoBlob, { contentType: 'image/jpeg' });
    if (uploadError) {
      console.error('photo upload error:', uploadError);
      throw uploadError;
    }
    const { data: pub } = supabase.storage
      .from(PHOTOS_BUCKET)
      .getPublicUrl(fileName);
    photoUrl = pub.publicUrl;
  }

  const { data, error } = await supabase
    .from('requests')
    .insert({
      id,
      apartment,
      title,
      description: description || null,
      photo_url: photoUrl,
      status: 'new',
    })
    .select()
    .single();

  if (error) {
    console.error('createRequest error:', error);
    throw error;
  }
  return normalize(data);
}

export async function updateRequest(id, updates) {
  const dbUpdates = { updated_at: new Date().toISOString() };
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
  if (updates.managementNote !== undefined) dbUpdates.management_note = updates.managementNote;

  const { data, error } = await supabase
    .from('requests')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    console.error('updateRequest error:', error);
    throw error;
  }
  return normalize(data);
}

export async function deleteRequest(id) {
  // Try to remove the photo first; ignore errors (orphaned photos are harmless)
  await supabase.storage
    .from(PHOTOS_BUCKET)
    .remove([`${id}.jpg`])
    .catch(() => {});

  const { error } = await supabase
    .from('requests')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('deleteRequest error:', error);
    throw error;
  }
}
