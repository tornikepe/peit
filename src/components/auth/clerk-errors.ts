// Maps Clerk API error codes to human copy in both site languages, so the
// custom auth forms never surface raw English API strings to a Georgian user.

interface ClerkApiError {
  errors?: { code?: string; message?: string; longMessage?: string }[];
  code?: string;
  longMessage?: string;
  message?: string;
}

const MAP: Record<string, { ka: string; en: string }> = {
  form_identifier_not_found: {
    ka: 'ამ ელფოსტით ანგარიში ვერ მოიძებნა.',
    en: 'No account found with this email.',
  },
  form_password_incorrect: {
    ka: 'პაროლი არასწორია.',
    en: 'Incorrect password.',
  },
  form_identifier_exists: {
    ka: 'ამ ელფოსტით ანგარიში უკვე არსებობს — სცადე შესვლა.',
    en: 'An account with this email already exists — try signing in.',
  },
  form_password_pwned: {
    ka: 'ეს პაროლი გატეხილ პაროლების ბაზაშია — აირჩიე სხვა.',
    en: 'This password appears in breached-password lists — choose another.',
  },
  form_password_length_too_short: {
    ka: 'პაროლი ძალიან მოკლეა — მინიმუმ 8 სიმბოლო.',
    en: 'Password is too short — at least 8 characters.',
  },
  form_param_format_invalid: {
    ka: 'ელფოსტის ფორმატი არასწორია.',
    en: 'Invalid email format.',
  },
  form_code_incorrect: {
    ka: 'კოდი არასწორია — გადაამოწმე და სცადე ისევ.',
    en: 'Incorrect code — check it and try again.',
  },
  verification_expired: {
    ka: 'კოდს ვადა გაუვიდა — გამოითხოვე ახალი.',
    en: 'The code expired — request a new one.',
  },
  session_exists: {
    ka: 'უკვე შესული ხარ.',
    en: 'You are already signed in.',
  },
  too_many_requests: {
    ka: 'ძალიან ბევრი ცდა — დაიცადე წუთი და სცადე ისევ.',
    en: 'Too many attempts — wait a minute and try again.',
  },
};

export function clerkErrorText(err: unknown, en: boolean): string {
  const e = err as ClerkApiError;
  // Clerk v7 errors carry a single .code; API-response errors carry .errors[].
  const code = e?.errors?.[0]?.code ?? e?.code;
  if (code && MAP[code]) return MAP[code][en ? 'en' : 'ka'];
  const msg = e?.errors?.[0]?.longMessage ?? e?.errors?.[0]?.message ?? e?.longMessage ?? e?.message;
  if (msg) return msg;
  return en ? 'Something went wrong — try again.' : 'რაღაც აირია — სცადე ისევ.';
}
