import { supabase } from '@/lib/supabase';

import type { ChatContext, ChatOutfitPayload } from './museChat';
import type { CatalogProduct } from '@/features/catalog/types';

export type MuseStoredMessage = {
  id: string;
  role: 'user' | 'muse' | 'assistant';
  content: string;
  payload?: {
    outfit?: ChatOutfitPayload;
    product?: CatalogProduct;
  };
  created_at: string;
};

export type MuseChatThread = {
  id: string;
  title: string;
  context: ChatContext | Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type MuseUserMemory = {
  summary: string;
  facts: string[];
};

export async function loadMuseMemory(userId: string): Promise<MuseUserMemory> {
  const { data, error } = await supabase
    .from('muse_user_memory')
    .select('summary, facts')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return {
    summary: data?.summary ?? '',
    facts: Array.isArray(data?.facts) ? data.facts : [],
  };
}

export async function saveMuseMemory(
  userId: string,
  memory: MuseUserMemory,
): Promise<void> {
  const { error } = await supabase.from('muse_user_memory').upsert(
    {
      user_id: userId,
      summary: memory.summary ?? '',
      facts: memory.facts ?? [],
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (error) throw error;
}

export async function listMuseThreads(userId: string): Promise<MuseChatThread[]> {
  const { data, error } = await supabase
    .from('muse_chat_threads')
    .select('id, title, context, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(40);
  if (error) throw error;
  return (data ?? []) as MuseChatThread[];
}

export async function createMuseThread(
  userId: string,
  input?: { title?: string; context?: Record<string, unknown> },
): Promise<MuseChatThread> {
  const { data, error } = await supabase
    .from('muse_chat_threads')
    .insert({
      user_id: userId,
      title: input?.title?.trim() || 'Muse chat',
      context: input?.context ?? {},
    })
    .select('id, title, context, created_at, updated_at')
    .single();
  if (error) throw error;
  return data as MuseChatThread;
}

export async function touchMuseThread(
  threadId: string,
  patch: { title?: string; context?: Record<string, unknown> },
): Promise<void> {
  const { error } = await supabase
    .from('muse_chat_threads')
    .update({
      ...(patch.title ? { title: patch.title } : {}),
      ...(patch.context ? { context: patch.context } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', threadId);
  if (error) throw error;
}

export async function loadMuseMessages(
  threadId: string,
): Promise<MuseStoredMessage[]> {
  const { data, error } = await supabase
    .from('muse_chat_messages')
    .select('id, role, content, payload, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    role: row.role as MuseStoredMessage['role'],
    content: row.content ?? '',
    payload: (row.payload ?? {}) as MuseStoredMessage['payload'],
    created_at: row.created_at,
  }));
}

export async function appendMuseMessage(input: {
  threadId: string;
  userId: string;
  role: 'user' | 'muse' | 'assistant';
  content: string;
  payload?: MuseStoredMessage['payload'];
}): Promise<MuseStoredMessage | null> {
  const content = input.content.trim();
  if (!content) return null;

  const { data, error } = await supabase
    .from('muse_chat_messages')
    .insert({
      thread_id: input.threadId,
      user_id: input.userId,
      role: input.role,
      content,
      payload: input.payload ?? {},
    })
    .select('id, role, content, payload, created_at')
    .single();
  if (error) throw error;

  await touchMuseThread(input.threadId, {});
  return {
    id: data.id,
    role: data.role as MuseStoredMessage['role'],
    content: data.content ?? '',
    payload: (data.payload ?? {}) as MuseStoredMessage['payload'],
    created_at: data.created_at,
  };
}

export async function deleteMuseThread(threadId: string): Promise<void> {
  const { error } = await supabase
    .from('muse_chat_threads')
    .delete()
    .eq('id', threadId);
  if (error) throw error;
}

export function titleFromMessage(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'Muse chat';
  return cleaned.length > 42 ? `${cleaned.slice(0, 42)}…` : cleaned;
}
