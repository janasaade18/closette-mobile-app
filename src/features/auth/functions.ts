import { supabase } from '@/lib/supabase';

async function readFunctionError(context: unknown) {
  if (!context || typeof context !== 'object' || !('json' in context)) return null;
  const read = context.json;
  if (typeof read !== 'function') return null;
  try {
    const payload = (await read.call(context)) as { error?: string };
    return payload.error ?? null;
  } catch {
    return null;
  }
}

export async function invokeFunction<T>(name: string, body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke<T & { error?: string }>(name, { body });
  if (error) {
    const context = 'context' in error ? error.context : null;
    const message = await readFunctionError(context);
    throw new Error(message || error.message || 'Request failed.');
  }
  if (data?.error) throw new Error(data.error);
  if (!data) throw new Error('Request failed.');
  return data;
}
