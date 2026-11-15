const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Parsed = { value: string | null; error: string | null };

function ok(value: string | null): Parsed {
  return { value, error: null };
}

function fail(error: string): Parsed {
  return { value: null, error };
}

export function optionalUrl(value: string, label: string): Parsed {
  const trimmed = value.trim();
  if (!trimmed) return ok(null);
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return fail(`Enter a valid ${label}.`);
    return ok(url.toString());
  } catch {
    return fail(`Enter a valid ${label}.`);
  }
}

export function optionalInstagram(value: string): Parsed {
  const trimmed = value.trim();
  if (!trimmed) return ok(null);
  if (trimmed.startsWith('@')) {
    const handle = trimmed.slice(1);
    if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) return fail('Enter a valid Instagram link.');
    return ok(`https://instagram.com/${handle}`);
  }
  return optionalUrl(trimmed, 'Instagram link');
}

export function optionalEmail(value: string): Parsed {
  const trimmed = value.trim();
  if (!trimmed) return ok(null);
  if (!EMAIL.test(trimmed)) return fail('Enter a valid contact email.');
  return ok(trimmed);
}

export function optionalPhone(value: string): Parsed {
  const trimmed = value.trim();
  if (!trimmed) return ok(null);
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 6 || digits.length > 15 || !/^[0-9+().\-\s]+$/.test(trimmed)) {
    return fail('Enter a valid phone number.');
  }
  return ok(trimmed);
}

export function optionalPlace(value: string, label: string): Parsed {
  const trimmed = value.trim();
  if (!trimmed) return ok(null);
  if (trimmed.length > 80) return fail(`${label} must be 80 characters or less.`);
  return ok(trimmed);
}
