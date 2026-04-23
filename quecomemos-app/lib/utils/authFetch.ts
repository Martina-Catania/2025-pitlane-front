'use client';

import { createClient } from '@/lib/supabase/client';

function withAuthorization(headers: HeadersInit | undefined, accessToken: string, includeJsonContentType: boolean): Headers {
  const mergedHeaders = new Headers(headers ?? {});
  mergedHeaders.set('Authorization', `Bearer ${accessToken}`);

  if (includeJsonContentType && !mergedHeaders.has('Content-Type')) {
    mergedHeaders.set('Content-Type', 'application/json');
  }

  return mergedHeaders;
}

export async function getAccessTokenOrThrow(errorMessage = 'Authentication required'): Promise<string> {
  const supabase = createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error(errorMessage);
  }

  return session.access_token;
}

export async function getCurrentUserAndAccessTokenOrThrow(): Promise<{ userId: string; accessToken: string }> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No user found');
  }

  const accessToken = await getAccessTokenOrThrow('No valid session found');

  return {
    userId: user.id,
    accessToken
  };
}

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: { includeJsonContentType?: boolean; tokenErrorMessage?: string } = {}
): Promise<Response> {
  const { includeJsonContentType = true, tokenErrorMessage = 'Authentication required' } = options;
  const accessToken = await getAccessTokenOrThrow(tokenErrorMessage);

  return fetch(input, {
    ...init,
    headers: withAuthorization(init.headers, accessToken, includeJsonContentType)
  });
}
