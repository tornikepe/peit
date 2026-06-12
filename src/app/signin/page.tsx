// Auth lives in a modal on the homepage — this stub keeps the /signin URL
// working (dashboard redirects, old links) by bouncing to "/" with the flag
// the AuthModalLauncher reads.
import { redirect } from 'next/navigation';

export default function SignInRedirect() {
  redirect('/?signin=1');
}
