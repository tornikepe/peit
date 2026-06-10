// /dashboard/conversations — auth + chrome handled by the parent
// dashboard layout. This page renders only the page-content frame:
// PageHeader plus the list / transcript drawer.

import type { Metadata } from 'next';
import PageHeader from '@/components/dashboard-shell/PageHeader';
import ConversationList from '@/components/conversations/ConversationList';
import T from '@/components/T';

export const metadata: Metadata = {
  title: 'საუბრების ისტორია — Peit',
};

export const dynamic = 'force-dynamic';

export default function ConversationsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Conversations"
        title={<T ka="საუბრების ისტორია" en="Conversation history" />}
        subtitle={<T ka="customer-დან მიღებული ყველა საუბარი — ვებსაიტი, Telegram, Instagram, Messenger." en="Every customer conversation — website, Telegram, Instagram, Messenger." />}
      />
      <ConversationList />
    </>
  );
}
