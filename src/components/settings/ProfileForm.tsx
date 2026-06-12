'use client';

// Editable display name + locale. Email + avatar are Clerk-owned;
// surfaced read-only with a "Manage account" deep-link to Clerk's hosted
// portal. Password changes live there too — implementing a local
// password endpoint would conflict with Clerk's session model.

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { Camera } from 'lucide-react';
import { DefaultAvatar } from '@/components/auth/UserMenu';
import { Loader2, Save, ExternalLink, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface Profile {
  name:     string | null;
  email:    string;
  imageUrl: string | null;
  locale:   string;
  manageAccountUrl?: string;
}

export default function ProfileForm() {
  const en = useLanguage().lang === 'en';
  const { user } = useUser();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name,    setName]    = useState('');
  const [locale,  setLocale]  = useState('ka');
  const [loading, setLoading] = useState(true);
  const [busy,    setBusy]    = useState(false);
  const [msg,     setMsg]     = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/settings/profile');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'load failed');
        setProfile(data.profile);
        setName(data.profile.name ?? '');
        setLocale(data.profile.locale ?? 'ka');
      } catch (e) {
        setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'load failed' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      setMsg({ kind: 'err', text: en ? 'Choose an image file.' : 'აირჩიე სურათის ფაილი.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMsg({ kind: 'err', text: en ? 'Max size is 5 MB.' : 'მაქს. ზომა 5 MB-ია.' });
      return;
    }
    setAvatarBusy(true);
    setMsg(null);
    try {
      await user.setProfileImage({ file });
      setProfile(p => p ? { ...p, imageUrl: user.imageUrl } : p);
      setMsg({ kind: 'ok', text: en ? 'Avatar updated' : 'ავატარი განახლდა' });
      setTimeout(() => setMsg(null), 2400);
    } catch {
      setMsg({ kind: 'err', text: en ? 'Upload failed — try again.' : 'ატვირთვა ვერ მოხერხდა — სცადე ისევ.' });
    } finally {
      setAvatarBusy(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), locale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'save failed');
      setMsg({ kind: 'ok', text: en ? 'Saved' : 'შენახულია' });
      // Auto-dismiss success — error stays until next save.
      setTimeout(() => setMsg(null), 2400);
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'save failed' });
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="glass rounded-2xl p-8 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-sm text-red-400">
        {msg?.text ?? 'profile unavailable'}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Profile card */}
      <form onSubmit={save} className="glass rounded-2xl p-6">
        <h2 className="text-white font-semibold text-lg">{en ? 'Profile' : 'პროფილი'}</h2>
        <p className="text-xs text-gray-500 mt-1">
          {en ? 'Your display name and the language of emails we send you' : 'საჯაროდ ხილული სახელი და გასაგზავნი email-ის ენა'}
        </p>

        <div className="mt-5 flex items-center gap-4">
          {/* Clickable avatar — uploads a new profile image via Clerk. */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={avatarBusy}
            className="relative group shrink-0 rounded-full disabled:opacity-60"
            title={en ? 'Change avatar' : 'ავატარის შეცვლა'}
            aria-label={en ? 'Change avatar' : 'ავატარის შეცვლა'}
          >
            {profile.imageUrl ? (
              <Image src={profile.imageUrl} alt={profile.name ?? profile.email} width={56} height={56} className="w-14 h-14 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-blue-500/50 transition-shadow" />
            ) : (
              <DefaultAvatar label={profile.name ?? profile.email} size={56} className="group-hover:ring-blue-500/50 transition-shadow" />
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-blue-600 border-2 border-[#0d0d1a] grid place-items-center">
              {avatarBusy
                ? <Loader2 className="w-3 h-3 text-white animate-spin" />
                : <Camera className="w-3 h-3 text-white" />}
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={uploadAvatar}
            className="hidden"
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white truncate">{profile.email}</div>
            <a
              href="https://accounts.clerk.com/user"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-violet-400 hover:text-violet-300 inline-flex items-center gap-1 mt-0.5"
            >
              <ExternalLink className="w-3 h-3" /> {en ? 'Email & password' : 'Email და პაროლი'}
            </a>
            <p className="text-[11px] text-gray-600 mt-1">{en ? 'Click the avatar to change it' : 'ავატარის შესაცვლელად დააჭირე მას'}</p>
          </div>
        </div>

        <label className="block mt-5">
          <span className="text-[11px] uppercase tracking-wider text-gray-500">{en ? 'Name' : 'სახელი'}</span>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={en ? 'Your full name' : 'შენი სრული სახელი'}
            maxLength={120}
            className="mt-1 w-full bg-white/[0.04] border border-white/[0.06] focus:border-violet-500/40 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none"
          />
        </label>

        <label className="block mt-4">
          <span className="text-[11px] uppercase tracking-wider text-gray-500">{en ? 'Email language' : 'Email-ის ენა'}</span>
          <select
            value={locale}
            onChange={e => setLocale(e.target.value)}
            className="mt-1 w-full bg-white/[0.04] border border-white/[0.06] focus:border-violet-500/40 rounded-lg px-3 py-2 text-sm text-white outline-none"
          >
            <option value="ka">ქართული</option>
            <option value="en">English</option>
          </select>
        </label>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-violet-500/90 hover:bg-violet-500 px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {en ? 'Save' : 'შენახვა'}
          </button>
          {msg && (
            <span className={`text-[11px] inline-flex items-center gap-1 ${msg.kind === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
              {msg.kind === 'ok' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              {msg.text}
            </span>
          )}
        </div>
      </form>

      {/* Password / security card — punts to Clerk. */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-white font-semibold">{en ? 'Password & security' : 'პაროლი + უსაფრთხოება'}</h3>
        <p className="text-sm text-gray-400 mt-1 leading-relaxed">
          {en ? 'Password, 2FA and connected accounts are managed on Clerk\u2019s hosted portal.' : 'პაროლის, 2FA-ის და დაკავშირებული ანგარიშების მართვა ხდება Clerk-ის ჰოსტიდან.'}
        </p>
        <a
          href="https://accounts.clerk.com/user"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-violet-300 border border-violet-500/30 hover:bg-violet-500/10 px-3 py-1.5 rounded-lg"
        >
          <Mail className="w-3.5 h-3.5" /> {en ? 'Manage account' : 'ანგარიშის მართვა'}
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
