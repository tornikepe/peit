'use client';

// Team management — owner sees themselves at the top (never deletable),
// then a table of invitees with role + status + actions. Owner controls
// everything; admins / members are surfaced read-only here for now since
// cross-tenant permissions aren't enforced yet.

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, X, AlertCircle, CheckCircle2 } from 'lucide-react';

type Role   = 'owner' | 'admin' | 'member';
type Status = 'pending' | 'active' | 'revoked';

interface OwnerRow {
  id:       string;
  email:    string;
  name:     string | null;
  imageUrl: string | null;
  role:     'owner';
  status:   'active';
}
interface MemberRow {
  id:         string;
  email:      string;
  role:       Role;
  status:     Status;
  invitedAt:  string;
  acceptedAt: string | null;
}

interface TeamView { owner: OwnerRow; members: MemberRow[] }

export default function TeamPanel() {
  const [data,    setData]    = useState<TeamView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/team');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'load failed');
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'load failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Async fetch — setState calls happen post-await, not synchronously
    // inside this effect. ESLint rule misfires.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-white font-semibold text-lg">გუნდი</h2>
            <p className="text-xs text-gray-500 mt-1">
              მოიწვიე თანამშრომელი — ცარიელი role-ბი ჯერ წყობილია (cross-tenant access მოვა მოგვიანებით)
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowInvite(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-violet-500/90 hover:bg-violet-500 px-4 py-2 rounded-lg"
          >
            <Plus className="w-3.5 h-3.5" /> წევრის მოწვევა
          </button>
        </div>

        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-500" /></div>
        ) : error ? (
          <p className="text-sm text-red-400 mt-4">{error}</p>
        ) : data && (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-wider text-gray-600">
                <tr>
                  <th className="text-left font-medium pb-2">წევრი</th>
                  <th className="text-left font-medium pb-2">როლი</th>
                  <th className="text-left font-medium pb-2">სტატუსი</th>
                  <th className="text-right font-medium pb-2"></th>
                </tr>
              </thead>
              <tbody>
                <OwnerTr owner={data.owner} />
                {data.members.map(m => (
                  <MemberTr key={m.id} member={m} onChange={load} />
                ))}
                {data.members.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-xs text-gray-500 py-6">
                      ჯერ წევრები არ მოგიწვევია
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onSuccess={() => { setShowInvite(false); void load(); }}
        />
      )}
    </div>
  );
}

function OwnerTr({ owner }: { owner: OwnerRow }) {
  return (
    <tr className="border-t border-white/[0.04]">
      <td className="py-3">
        <div className="flex items-center gap-2.5">
          {owner.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={owner.imageUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-violet-500/30 text-violet-200 grid place-items-center text-[11px] font-medium">
              {(owner.name ?? owner.email).slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-white text-sm truncate">{owner.name ?? owner.email}</div>
            {owner.name && <div className="text-[11px] text-gray-500 truncate">{owner.email}</div>}
          </div>
        </div>
      </td>
      <td className="py-3"><Pill kind="owner">Owner</Pill></td>
      <td className="py-3"><Pill kind="active">აქტიური</Pill></td>
      <td className="py-3 text-right text-[10px] text-gray-600">თქვენ</td>
    </tr>
  );
}

function MemberTr({ member, onChange }: { member: MemberRow; onChange: () => void }) {
  const [busy, setBusy] = useState(false);

  async function changeRole(role: 'admin' | 'member') {
    setBusy(true);
    try {
      await fetch(`/api/settings/team/${member.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      onChange();
    } finally { setBusy(false); }
  }

  async function remove() {
    if (!confirm(`${member.email}-ის წაშლა?`)) return;
    setBusy(true);
    try {
      await fetch(`/api/settings/team/${member.id}`, { method: 'DELETE' });
      onChange();
    } finally { setBusy(false); }
  }

  return (
    <tr className="border-t border-white/[0.04]">
      <td className="py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-white/[0.05] text-gray-300 grid place-items-center text-[11px]">
            {member.email.slice(0, 1).toUpperCase()}
          </div>
          <span className="text-gray-200 text-sm truncate">{member.email}</span>
        </div>
      </td>
      <td className="py-3">
        <select
          value={member.role}
          onChange={e => changeRole(e.target.value as 'admin' | 'member')}
          disabled={busy || member.role === 'owner'}
          className="bg-white/[0.04] border border-white/[0.06] rounded px-2 py-1 text-xs text-white disabled:opacity-60"
        >
          <option value="admin">Admin</option>
          <option value="member">Member</option>
        </select>
      </td>
      <td className="py-3">
        <Pill kind={member.status === 'active' ? 'active' : member.status === 'pending' ? 'pending' : 'revoked'}>
          {member.status === 'pending' ? 'მოლოდინში' : member.status === 'active' ? 'აქტიური' : 'გაუქმებული'}
        </Pill>
      </td>
      <td className="py-3 text-right">
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="text-red-400 hover:text-red-300 inline-flex items-center gap-1 text-xs disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
        </button>
      </td>
    </tr>
  );
}

function Pill({ kind, children }: { kind: 'owner' | 'active' | 'pending' | 'revoked'; children: React.ReactNode }) {
  const cls =
    kind === 'owner'   ? 'bg-violet-500/15 text-violet-200 border border-violet-500/30' :
    kind === 'active'  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' :
    kind === 'pending' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                         'bg-gray-500/10 text-gray-400 border border-gray-500/20';
  return <span className={`text-[10px] px-2 py-0.5 rounded-full ${cls}`}>{children}</span>;
}

function InviteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [role,  setRole]  = useState<'admin' | 'member'>('member');
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/settings/team/invite', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? json.error ?? 'invite failed');
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'invite failed');
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center px-4" onClick={onClose}>
      <form
        onClick={e => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md bg-[#0d0d1a] border border-white/10 rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">წევრის მოწვევა</h3>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-gray-500">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="member@company.ge"
            className="mt-1 w-full bg-white/[0.04] border border-white/[0.06] focus:border-violet-500/40 rounded-lg px-3 py-2 text-sm text-white outline-none"
          />
        </label>

        <label className="block mt-3">
          <span className="text-[11px] uppercase tracking-wider text-gray-500">როლი</span>
          <select
            value={role}
            onChange={e => setRole(e.target.value as 'admin' | 'member')}
            className="mt-1 w-full bg-white/[0.04] border border-white/[0.06] focus:border-violet-500/40 rounded-lg px-3 py-2 text-sm text-white outline-none"
          >
            <option value="member">Member — გუნდის ჩვეულებრივი წევრი</option>
            <option value="admin">Admin — შეუძლია სხვების მოწვევა</option>
          </select>
        </label>

        {error && (
          <p className="mt-3 text-xs text-red-400 inline-flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {error}
          </p>
        )}

        <div className="mt-5 flex items-center gap-3">
          <button
            type="submit"
            disabled={busy || email.length < 5}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-violet-500/90 hover:bg-violet-500 px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            მოწვევის გაგზავნა
          </button>
          <button type="button" onClick={onClose} className="text-xs text-gray-400 hover:text-white">
            გაუქმება
          </button>
        </div>
      </form>
    </div>
  );
}
