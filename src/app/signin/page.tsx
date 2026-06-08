// Sign-in has no standalone page anymore — it's a modal on the homepage.
// This stub keeps the /signin URL working (old links, redirects) by bouncing
// to "/" with the flag that opens the sign-in modal.
import { redirect } from 'next/navigation';

export default function SignInRedirect() {
  redirect('/?signin=1');
}
