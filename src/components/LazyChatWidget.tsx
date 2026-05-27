'use client';

// Client-component wrapper that lazy-loads the real ChatWidget bundle.
// Next 14+ refuses `next/dynamic({ ssr: false })` inside Server Components,
// so the dynamic() call has to live behind a 'use client' boundary.
//
// The placeholder is the same 60×60 bottom-right footprint as the real
// launcher — zero CLS when it swaps in.

import dynamic from 'next/dynamic';
import { ChatWidgetSkeleton } from '@/components/ui/Skeleton';

const ChatWidget = dynamic(() => import('@/components/ChatWidget'), {
  ssr: false,
  loading: () => <ChatWidgetSkeleton />,
});

export default function LazyChatWidget() {
  return <ChatWidget />;
}
