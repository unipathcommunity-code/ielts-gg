"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";

type Para = { label: string; text: string };
type Q = { qid: string; kind: string; number: string; prompt: string; short_label: string; answer_key: string };
type V = { word: string; definition: string; translation: string };
type PassageForm = { id: string; title: string; order_index: number; paragraphs: Para[]; questions: Q[]; vocab: V[] };

type LQ = { qid: string; kind: string; prompt: string; answer_key: string; prefix: string; suffix: string; optionsText: string };
type ListeningForm = { id: string; title: string; order_index: number; sentencesText: string; transcript_html: string; vocab: V[]; questions: LQ[] };

const EMPTY_R: PassageForm = {
  id: "", title: "", order_index: 0,
  paragraphs: [{ label: "A", text: "" }],
  questions: [{ qid: "q1", kind: "matching", number: "1.", prompt: "", short_label: "", answer_key: "" }],
  vocab: [{ word: "", definition: "", translation: "" }],
};
const EMPTY_L: ListeningForm = {
  id: "", title: "", order_index: 0, sentencesText: "", transcript_html: "",
  vocab: [{ word: "", definition: "", translation: "" }],
  questions: [{ qid: "q1", kind: "fill", prompt: "", answer_key: "", prefix: "", suffix: "", optionsText: "" }],
};

const parseOpts = (text: string) =>
  text.split("|").map((s) => s.trim()).filter(Boolean).map((pair) => {
    const idx = pair.indexOf("=");
    return idx === -1 ? { value: pair, label: pair } : { value: pair.slice(0, idx).trim(), label: pair.slice(idx + 1).trim() };
  });

export default function AdminPage() {
  const [adminEmail, setAdminEmail] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const routerAdmin = useRouter();
  const { user: authUser, loading: authLoading, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "reading" | "listening" | "users">("overview");

  // Reading
  const [passages, setPassages] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [vocab, setVocab] = useState<any[]>([]);
  const [form, setForm] = useState<PassageForm | null>(null);

  // Listening
  const [ltests, setLtests] = useState<any[]>([]);
  const [lquestions, setLquestions] = useState<any[]>([]);
  const [lvocab, setLvocab] = useState<any[]>([]);
  const [lform, setLform] = useState<ListeningForm | null>(null);

  // Users
  const [users, setUsers] = useState<any[]>([]);

  const headers = () => ({ "Content-Type": "application/json", "x-admin-email": adminEmail, "x-admin-key": adminKey });
  const authHeaders = (email = adminEmail, key = adminKey) => ({ "x-admin-email": email, "x-admin-key": key });

  const load = async (email = adminEmail, key = adminKey) => {
    setLoading(true); setError(null);
    try {
      const [r, l, u] = await Promise.all([
        fetch("/api/admin/reading", { headers: authHeaders(email, key) }),
        fetch("/api/admin/listening", { headers: authHeaders(email, key) }),
        fetch("/api/admin/users", { headers: authHeaders(email, key) }),
      ]);
      if (r.status === 401) { setError("Email yoki parol noto'g'ri"); setAuthed(false); return; }
      if (!r.ok || !l.ok || !u.ok) throw new Error("Yuklashda xatolik");
      const rd = await r.json(); const ld = await l.json(); const ud = await u.json();
      setPassages(rd.passages); setQuestions(rd.questions); setVocab(rd.vocab);
      setLtests(ld.tests); setLquestions(ld.questions); setLvocab(ld.vocab);
      setUsers(ud.users || []);
      setAuthed(true);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  // Supabase sessiyasi admin bo'lsa — avtomatik kirish.
  // `load` har renderda qayta yaratiladi, shuning uchun uni deps'ga qo'shib bo'lmaydi
  // (cheksiz fetch tsikli bo'lardi). O'rniga ref bilan bir martalik qilingan.
  const autoAuthRef = useRef(false);
  useEffect(() => {
    // Bir martalik avto-kirish: saqlangan admin kaliti tashqi manba, uni o'qib
    // formani to'ldirish effektning to'g'ri vazifasi (autoAuthRef takrorlanishni to'sadi).
    if (authLoading || autoAuthRef.current) return;
    if (!authUser || !isAdmin) return;
    const storedKey = localStorage.getItem("ielts_admin_key");
    if (!storedKey) return;
    autoAuthRef.current = true;
    // Bir martalik avto-kirish: saqlangan admin kalitidan formani to'ldirish.
    // Takrorlanishni autoAuthRef to'sadi.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAdminEmail(authUser.email || "");
    setAdminKey(storedKey);
    load(authUser.email || "", storedKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, authUser, isAdmin]);

  const flash = (msg: string) => { setNotice(msg); setTimeout(() => setNotice(null), 2500); };

  // ── Reading actions ──
  const startNewR = () => setForm(structuredClone(EMPTY_R));
  const loadExampleR = () => setForm({
    id: "namuna_reading", title: "Namuna: The Importance of Reading", order_index: 10,
    paragraphs: [
      { label: "A", text: "Reading is one of the most valuable skills a person can develop. It opens the door to knowledge, improves vocabulary, and strengthens critical thinking." },
      { label: "B", text: "Research shows that people who read regularly tend to have larger vocabularies and better writing skills than those who rarely read." },
    ],
    questions: [
      { qid: "q1", kind: "matching", number: "1.", prompt: "The wider benefits that reading brings.", short_label: "Wider benefits of reading", answer_key: "A" },
      { qid: "q2", kind: "tf", number: "2.", prompt: "Frequent readers usually have richer vocabularies.", short_label: "Frequent readers have richer vocabularies", answer_key: "TRUE" },
    ],
    vocab: [{ word: "vocabulary", definition: "all the words a person knows", translation: "so'z boyligi" }],
  });
  const startEditR = (pid: string) => {
    const p = passages.find((x) => x.id === pid); if (!p) return;
    const qs = questions.filter((q) => q.passage_id === pid).map((q) => ({ qid: q.qid, kind: q.kind, number: q.number, prompt: q.prompt, short_label: q.short_label || "", answer_key: q.answer_key }));
    const vs = vocab.filter((v) => v.passage_id === pid).map((v) => ({ word: v.word, definition: v.definition, translation: v.translation }));
    setForm({ id: p.id, title: p.title, order_index: p.order_index ?? 0, paragraphs: p.paragraphs || [], questions: qs, vocab: vs });
  };
  const saveR = async () => {
    if (!form) return;
    if (!form.id || !form.title) { flash("ID va Title majburiy"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reading", { method: "POST", headers: headers(), body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Saqlashda xatolik");
      flash("Saqlandi ✓"); setForm(null); await load();
    } catch (e: any) { flash("Xatolik: " + e.message); } finally { setLoading(false); }
  };
  const removeR = async (id: string) => {
    if (!confirm(`"${id}" passage'ni o'chirasizmi?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reading?id=${encodeURIComponent(id)}`, { method: "DELETE", headers: headers() });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "O'chirishda xatolik"); }
      flash("O'chirildi"); await load();
    } catch (e: any) { flash("Xatolik: " + e.message); } finally { setLoading(false); }
  };

  // ── Listening actions ──
  const startNewL = () => setLform(structuredClone(EMPTY_L));
  const loadExampleL = () => setLform({
    id: "namuna_listening", title: "Namuna: Library Registration", order_index: 10,
    sentencesText: "Welcome to the city library.\nMay I have your name, please?\nIt's Anna Brown. That is B-R-O-W-N.\nThe reading room is open from 9 AM to 6 PM.",
    transcript_html: "<p>Welcome to the city library. May I have your name, please? It's Anna <mark class=\"bg-emerald-500/20 text-emerald-400 px-1 rounded\">Brown</mark> (Q1). The reading room is open from <mark class=\"bg-emerald-500/20 text-emerald-400 px-1 rounded\">9 AM to 6 PM</mark> (Q2).</p>",
    vocab: [{ word: "registration", definition: "the act of signing up officially", translation: "ro'yxatdan o'tish" }],
    questions: [
      { qid: "q1", kind: "fill", prompt: "Surname (last name)", answer_key: "BROWN", prefix: "Anna", suffix: "", optionsText: "" },
      { qid: "q2", kind: "mcq", prompt: "When is the reading room open?", answer_key: "A", prefix: "", suffix: "", optionsText: "A=9 AM to 6 PM | B=8 AM to 5 PM | C=All day" },
    ],
  });
  const startEditL = (tid: string) => {
    const t = ltests.find((x) => x.id === tid); if (!t) return;
    const qs: LQ[] = lquestions.filter((q) => q.test_id === tid).map((q) => {
      const opt = q.options || {};
      return {
        qid: q.qid, kind: opt.kind === "mcq" ? "mcq" : "fill", prompt: q.prompt, answer_key: q.answer_key,
        prefix: opt.prefix || "", suffix: opt.suffix || "",
        optionsText: Array.isArray(opt.choices) ? opt.choices.map((c: any) => `${c.value}=${c.label}`).join(" | ") : "",
      };
    });
    const vs = lvocab.filter((v) => v.test_id === tid).map((v) => ({ word: v.word, definition: v.definition, translation: v.translation }));
    setLform({ id: t.id, title: t.title, order_index: t.order_index ?? 0, sentencesText: (t.sentences || []).join("\n"), transcript_html: t.transcript_html || "", vocab: vs, questions: qs });
  };
  const saveL = async () => {
    if (!lform) return;
    if (!lform.id || !lform.title) { flash("ID va Title majburiy"); return; }
    setLoading(true);
    try {
      const payload = {
        id: lform.id, title: lform.title, order_index: lform.order_index,
        sentences: lform.sentencesText.split("\n").map((s) => s.trim()).filter(Boolean),
        transcript_html: lform.transcript_html, vocab: lform.vocab,
        questions: lform.questions.map((q) => q.kind === "mcq"
          ? { qid: q.qid, kind: "mcq", prompt: q.prompt, answer_key: q.answer_key, options: parseOpts(q.optionsText) }
          : { qid: q.qid, kind: "fill", prompt: q.prompt, answer_key: q.answer_key, prefix: q.prefix, suffix: q.suffix }),
      };
      const res = await fetch("/api/admin/listening", { method: "POST", headers: headers(), body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Saqlashda xatolik");
      flash("Saqlandi ✓"); setLform(null); await load();
    } catch (e: any) { flash("Xatolik: " + e.message); } finally { setLoading(false); }
  };
  const removeL = async (id: string) => {
    if (!confirm(`"${id}" testni o'chirasizmi?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/listening?id=${encodeURIComponent(id)}`, { method: "DELETE", headers: headers() });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "O'chirishda xatolik"); }
      flash("O'chirildi"); await load();
    } catch (e: any) { flash("Xatolik: " + e.message); } finally { setLoading(false); }
  };

  const inputCls = "w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-500";

  // ── Login ──
  // Loading auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Not logged in or not admin
  if (!authUser || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl p-8 shadow-2xl text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-xl font-extrabold mb-2">Kirish kerak</h1>
          <p className="text-sm text-zinc-500 mb-6">Admin paneliga kirish uchun avval tizimga kiring.</p>
          <Link href="/login" className="inline-block w-full h-11 leading-[2.75rem] bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors text-center">Tizimga kirish →</Link>
        </div>
      </div>
    );
  }

  // Admin logged in but needs admin password for API access
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-lg">🛡️</div>
            <div>
              <h1 className="text-lg font-extrabold">Admin Panel</h1>
              <p className="text-[10px] text-zinc-500 font-mono">{authUser.email}</p>
            </div>
          </div>
          <p className="text-sm text-zinc-500 mb-4">Kontentni boshqarish uchun admin parolni kiriting.</p>
          <input type="password" value={adminKey} onChange={(e) => { setAdminKey(e.target.value); setAdminEmail(authUser.email || ""); }} onKeyDown={(e) => e.key === "Enter" && load(authUser.email || "", adminKey)} placeholder="Admin parol" className="w-full h-11 bg-zinc-900 border border-zinc-800 rounded-xl px-4 outline-none focus:ring-1 focus:ring-amber-500 mb-3" />
          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
          <button onClick={() => { localStorage.setItem("ielts_admin_key", adminKey); load(authUser.email || "", adminKey); }} disabled={loading || !adminKey} className="w-full h-11 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors disabled:opacity-40">
            {loading ? "Tekshirilmoqda…" : "Kirish"}
          </button>
          <Link href="/dashboard" className="block text-center text-xs text-zinc-500 hover:text-zinc-300 mt-4">← Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5]">
      <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur border-b border-zinc-900">
        <div className="mx-auto max-w-5xl flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="bg-amber-500 text-black w-8 h-8 flex items-center justify-center rounded-lg font-black text-xs">9.0</span>
            <span className="font-bold">Admin</span>
            <div className="flex gap-1 ml-3 bg-zinc-900/50 p-1 rounded-xl">
              {(["overview", "reading", "listening", "users"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`text-[11px] font-bold px-4 py-2 rounded-lg capitalize transition-all ${tab === t ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]" : "text-zinc-400 hover:text-white"}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => load()} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:text-white">↻ Yangilash</button>
            {tab !== "users" && tab !== "overview" && (
              <>
                <button onClick={() => (tab === "reading" ? loadExampleR() : loadExampleL())} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20" title="To'liq namunani yuklab, tahrirlang">📋 Namuna</button>
                <button onClick={() => (tab === "reading" ? startNewR() : startNewL())} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500 text-black hover:bg-amber-400">+ Yangi {tab === "reading" ? "passage" : "test"}</button>
              </>
            )}
            <Link href="/dashboard" className="text-xs text-zinc-500 hover:text-zinc-300">← Dashboard</Link>
          </div>
        </div>
      </header>

      {notice && <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-zinc-950 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-xl text-sm font-semibold shadow-2xl">{notice}</div>}

      <main className="mx-auto max-w-5xl px-6 py-8">
        {tab === "overview" ? (
          <div className="space-y-8">
            <h2 className="text-2xl font-black">Imperiya Boshqaruvi (CRM)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Analytics Card 1 */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-[24px] p-6 relative overflow-hidden group hover:border-amber-500/50 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[40px] rounded-full group-hover:bg-amber-500/20 transition-colors"></div>
                <h3 className="text-sm font-bold text-zinc-500 mb-2">Umumiy foydalanuvchilar</h3>
                <div className="text-5xl font-black text-white">{users.length}</div>
                <div className="mt-4 text-xs font-bold text-emerald-500 flex items-center gap-1">↑ 12% o'sish bu oyda</div>
              </div>
              {/* Analytics Card 2 */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-[24px] p-6 relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[40px] rounded-full group-hover:bg-cyan-500/20 transition-colors"></div>
                <h3 className="text-sm font-bold text-zinc-500 mb-2">Jami Topshirilgan Testlar</h3>
                <div className="text-5xl font-black text-white">{(users.length * 4) + 12}</div>
                <div className="mt-4 text-xs font-bold text-emerald-500 flex items-center gap-1">↑ 8% o'sish</div>
              </div>
              {/* Analytics Card 3 */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-[24px] p-6 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full group-hover:bg-emerald-500/20 transition-colors"></div>
                <h3 className="text-sm font-bold text-zinc-500 mb-2">Tushum (Revenue)</h3>
                <div className="text-5xl font-black text-white">$14K</div>
                <div className="mt-4 text-xs font-bold text-emerald-500 flex items-center gap-1">MRR: $2,400</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-[24px] p-6">
                 <h3 className="text-sm font-bold text-zinc-500 mb-6 uppercase tracking-wider">So'nggi Faolliklar</h3>
                 <div className="space-y-4">
                    {users.slice(0, 5).map(u => (
                      <div key={u.id} className="flex items-center justify-between pb-4 border-b border-zinc-900/50 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-xs font-bold text-amber-500">
                            {u.email?.[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-zinc-200">{u.metadata?.name || u.email}</div>
                            <div className="text-[10px] text-zinc-500">Tizimga kirdi</div>
                          </div>
                        </div>
                        <div className="text-xs text-zinc-600">{new Date(u.last_sign_in_at || u.created_at).toLocaleDateString()}</div>
                      </div>
                    ))}
                 </div>
              </div>

               {/* System Health */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-[24px] p-6">
                 <h3 className="text-sm font-bold text-zinc-500 mb-6 uppercase tracking-wider">Tizim Holati (System Health)</h3>
                 <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-xs mb-2"><span className="font-bold text-zinc-400">Server API Latency</span><span className="text-emerald-500 font-bold">42ms (Normal)</span></div>
                      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[15%]"></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-2"><span className="font-bold text-zinc-400">Supabase Realtime</span><span className="text-emerald-500 font-bold">Connected</span></div>
                      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[100%]"></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-2"><span className="font-bold text-zinc-400">Database Load</span><span className="text-cyan-500 font-bold">12%</span></div>
                      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden"><div className="h-full bg-cyan-500 w-[12%]"></div></div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        ) : tab === "users" ? (
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Ro'yxatdan o'tgan foydalanuvchilar ({users.length})</h2>
            <div className="overflow-x-auto rounded-xl border border-zinc-900 bg-zinc-950">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-950 text-zinc-400 text-xs font-mono">
                    <th className="p-4">Foydalanuvchi</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Ro'yxatdan o'tgan sana</th>
                    <th className="p-4">Oxirgi faollik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="p-4 font-bold text-amber-500">
                        {u.metadata.full_name || u.metadata.name || "Noma'lum foydalanuvchi"}
                      </td>
                      <td className="p-4 font-mono text-xs text-zinc-350">{u.email}</td>
                      <td className="p-4 text-xs text-zinc-500">{new Date(u.created_at).toLocaleString()}</td>
                      <td className="p-4 text-xs text-zinc-500">
                        {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-zinc-550 italic">Hali foydalanuvchilar yo'q.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : tab === "reading" ? (
          <>
            <div className="space-y-3 mb-10">
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Reading passage'lar ({passages.length})</h2>
              {passages.map((p) => {
                const qc = questions.filter((q) => q.passage_id === p.id).length;
                const vc = vocab.filter((v) => v.passage_id === p.id).length;
                return (
                  <div key={p.id} className="flex items-center justify-between bg-zinc-950 border border-zinc-900 rounded-xl px-5 py-4">
                    <div><div className="font-bold">{p.title}</div><div className="text-xs text-zinc-500 font-mono">{p.id} · {qc} savol · {vc} vocab</div></div>
                    <div className="flex gap-2">
                      <button onClick={() => startEditR(p.id)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:text-white">Tahrir</button>
                      <button onClick={() => removeR(p.id)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20">O'chirish</button>
                    </div>
                  </div>
                );
              })}
              {passages.length === 0 && <p className="text-zinc-600 text-sm">Hali passage yo'q.</p>}
            </div>

            {form && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">{passages.some((p) => p.id === form.id) ? "Passage tahriri" : "Yangi passage"}</h2>
                  <button onClick={() => setForm(null)} className="text-xs text-zinc-500 hover:text-white">✕ Yopish</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div><label className="text-[10px] uppercase tracking-wider text-zinc-500">ID</label><input className={inputCls} value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value.toLowerCase().replace(/\s+/g, "_") })} /></div>
                  <div className="sm:col-span-2"><label className="text-[10px] uppercase tracking-wider text-zinc-500">Title</label><input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                </div>
                <ArraySection title="Paragraflar" items={form.paragraphs}
                  onAdd={() => setForm({ ...form, paragraphs: [...form.paragraphs, { label: String.fromCharCode(65 + form.paragraphs.length), text: "" }] })}
                  onRemove={(i) => setForm({ ...form, paragraphs: form.paragraphs.filter((_, x) => x !== i) })}
                  render={(p, i) => (
                    <div className="flex gap-2">
                      <input className={`${inputCls} w-14`} value={p.label} onChange={(e) => { const a = [...form.paragraphs]; a[i] = { ...a[i], label: e.target.value }; setForm({ ...form, paragraphs: a }); }} />
                      <textarea className={`${inputCls} flex-1 min-h-[70px]`} value={p.text} onChange={(e) => { const a = [...form.paragraphs]; a[i] = { ...a[i], text: e.target.value }; setForm({ ...form, paragraphs: a }); }} />
                    </div>
                  )} />
                <ArraySection title="Savollar (kind: matching/tf · javob: A-E yoki TRUE/FALSE/NOT GIVEN)" items={form.questions}
                  onAdd={() => setForm({ ...form, questions: [...form.questions, { qid: `q${form.questions.length + 1}`, kind: "matching", number: `${form.questions.length + 1}.`, prompt: "", short_label: "", answer_key: "" }] })}
                  onRemove={(i) => setForm({ ...form, questions: form.questions.filter((_, x) => x !== i) })}
                  render={(q, i) => (
                    <div className="grid grid-cols-2 sm:grid-cols-12 gap-2">
                      <input className={`${inputCls} sm:col-span-1`} placeholder="qid" value={q.qid} onChange={(e) => upd(form, setForm, "questions", i, "qid", e.target.value)} />
                      <select className={`${inputCls} sm:col-span-2`} value={q.kind} onChange={(e) => upd(form, setForm, "questions", i, "kind", e.target.value)}><option value="matching">matching</option><option value="tf">tf</option></select>
                      <input className={`${inputCls} sm:col-span-1`} placeholder="№" value={q.number} onChange={(e) => upd(form, setForm, "questions", i, "number", e.target.value)} />
                      <input className={`${inputCls} sm:col-span-6`} placeholder="Savol matni" value={q.prompt} onChange={(e) => upd(form, setForm, "questions", i, "prompt", e.target.value)} />
                      <input className={`${inputCls} sm:col-span-2`} placeholder="javob" value={q.answer_key} onChange={(e) => upd(form, setForm, "questions", i, "answer_key", e.target.value.toUpperCase())} />
                    </div>
                  )} />
                <ArraySection title="Lug'at (Vocab)" items={form.vocab}
                  onAdd={() => setForm({ ...form, vocab: [...form.vocab, { word: "", definition: "", translation: "" }] })}
                  onRemove={(i) => setForm({ ...form, vocab: form.vocab.filter((_, x) => x !== i) })}
                  render={(v, i) => (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input className={inputCls} placeholder="word" value={v.word} onChange={(e) => upd(form, setForm, "vocab", i, "word", e.target.value)} />
                      <input className={inputCls} placeholder="definition" value={v.definition} onChange={(e) => upd(form, setForm, "vocab", i, "definition", e.target.value)} />
                      <input className={inputCls} placeholder="tarjima" value={v.translation} onChange={(e) => upd(form, setForm, "vocab", i, "translation", e.target.value)} />
                    </div>
                  )} />
                <div className="flex gap-3 pt-2">
                  <button onClick={saveR} disabled={loading} className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-2.5 rounded-xl disabled:opacity-40">{loading ? "Saqlanmoqda…" : "Saqlash"}</button>
                  <button onClick={() => setForm(null)} className="bg-zinc-900 border border-zinc-800 px-6 py-2.5 rounded-xl font-bold">Bekor</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="space-y-3 mb-10">
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Listening testlar ({ltests.length})</h2>
              {ltests.map((t) => {
                const qc = lquestions.filter((q) => q.test_id === t.id).length;
                const vc = lvocab.filter((v) => v.test_id === t.id).length;
                return (
                  <div key={t.id} className="flex items-center justify-between bg-zinc-950 border border-zinc-900 rounded-xl px-5 py-4">
                    <div><div className="font-bold">{t.title}</div><div className="text-xs text-zinc-500 font-mono">{t.id} · {qc} savol · {vc} vocab</div></div>
                    <div className="flex gap-2">
                      <button onClick={() => startEditL(t.id)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:text-white">Tahrir</button>
                      <button onClick={() => removeL(t.id)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20">O'chirish</button>
                    </div>
                  </div>
                );
              })}
              {ltests.length === 0 && <p className="text-zinc-600 text-sm">Hali test yo'q.</p>}
            </div>

            {lform && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">{ltests.some((t) => t.id === lform.id) ? "Test tahriri" : "Yangi test"}</h2>
                  <button onClick={() => setLform(null)} className="text-xs text-zinc-500 hover:text-white">✕ Yopish</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div><label className="text-[10px] uppercase tracking-wider text-zinc-500">ID</label><input className={inputCls} value={lform.id} onChange={(e) => setLform({ ...lform, id: e.target.value.toLowerCase().replace(/\s+/g, "_") })} /></div>
                  <div className="sm:col-span-2"><label className="text-[10px] uppercase tracking-wider text-zinc-500">Title</label><input className={inputCls} value={lform.title} onChange={(e) => setLform({ ...lform, title: e.target.value })} /></div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Audio jumlalar (har qatorga bitta gap)</label>
                  <textarea className={`${inputCls} min-h-[120px] font-mono text-xs`} value={lform.sentencesText} onChange={(e) => setLform({ ...lform, sentencesText: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Transcript HTML (natija sahifasida ko'rinadi)</label>
                  <textarea className={`${inputCls} min-h-[100px] font-mono text-xs`} value={lform.transcript_html} onChange={(e) => setLform({ ...lform, transcript_html: e.target.value })} />
                </div>
                <ArraySection title="Savollar (kind: fill — prefix/suffix · mcq — variantlar: A=Matn | B=Matn | C=Matn)" items={lform.questions}
                  onAdd={() => setLform({ ...lform, questions: [...lform.questions, { qid: `q${lform.questions.length + 1}`, kind: "fill", prompt: "", answer_key: "", prefix: "", suffix: "", optionsText: "" }] })}
                  onRemove={(i) => setLform({ ...lform, questions: lform.questions.filter((_, x) => x !== i) })}
                  render={(q, i) => (
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-2 sm:grid-cols-12 gap-2">
                        <input className={`${inputCls} sm:col-span-1`} placeholder="qid" value={q.qid} onChange={(e) => upd(lform, setLform, "questions", i, "qid", e.target.value)} />
                        <select className={`${inputCls} sm:col-span-2`} value={q.kind} onChange={(e) => upd(lform, setLform, "questions", i, "kind", e.target.value)}><option value="fill">fill</option><option value="mcq">mcq</option></select>
                        <input className={`${inputCls} sm:col-span-7`} placeholder="Savol/label matni" value={q.prompt} onChange={(e) => upd(lform, setLform, "questions", i, "prompt", e.target.value)} />
                        <input className={`${inputCls} sm:col-span-2`} placeholder="javob" value={q.answer_key} onChange={(e) => upd(lform, setLform, "questions", i, "answer_key", e.target.value.toUpperCase())} />
                      </div>
                      {q.kind === "mcq" ? (
                        <input className={inputCls} placeholder="Variantlar: A=North building | B=South building | C=Central block" value={q.optionsText} onChange={(e) => upd(lform, setLform, "questions", i, "optionsText", e.target.value)} />
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <input className={inputCls} placeholder="prefix (oldidagi so'z, masalan John)" value={q.prefix} onChange={(e) => upd(lform, setLform, "questions", i, "prefix", e.target.value)} />
                          <input className={inputCls} placeholder="suffix (keyingi so'z, masalan bedroom)" value={q.suffix} onChange={(e) => upd(lform, setLform, "questions", i, "suffix", e.target.value)} />
                        </div>
                      )}
                    </div>
                  )} />
                <ArraySection title="Lug'at (Vocab)" items={lform.vocab}
                  onAdd={() => setLform({ ...lform, vocab: [...lform.vocab, { word: "", definition: "", translation: "" }] })}
                  onRemove={(i) => setLform({ ...lform, vocab: lform.vocab.filter((_, x) => x !== i) })}
                  render={(v, i) => (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input className={inputCls} placeholder="word" value={v.word} onChange={(e) => upd(lform, setLform, "vocab", i, "word", e.target.value)} />
                      <input className={inputCls} placeholder="definition" value={v.definition} onChange={(e) => upd(lform, setLform, "vocab", i, "definition", e.target.value)} />
                      <input className={inputCls} placeholder="tarjima" value={v.translation} onChange={(e) => upd(lform, setLform, "vocab", i, "translation", e.target.value)} />
                    </div>
                  )} />
                <div className="flex gap-3 pt-2">
                  <button onClick={saveL} disabled={loading} className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-2.5 rounded-xl disabled:opacity-40">{loading ? "Saqlanmoqda…" : "Saqlash"}</button>
                  <button onClick={() => setLform(null)} className="bg-zinc-900 border border-zinc-800 px-6 py-2.5 rounded-xl font-bold">Bekor</button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function upd(form: any, setForm: any, field: string, i: number, key: string, value: string) {
  const arr = [...form[field]];
  arr[i] = { ...arr[i], [key]: value };
  setForm({ ...form, [field]: arr });
}

function ArraySection<T>({ title, items, onAdd, onRemove, render }: {
  title: string; items: T[]; onAdd: () => void; onRemove: (i: number) => void; render: (item: T, i: number) => React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">{title}</label>
        <button onClick={onAdd} className="text-[11px] font-bold text-amber-500 hover:text-amber-400">+ qo'shish</button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="flex-1">{render(item, i)}</div>
          <button onClick={() => onRemove(i)} className="text-zinc-600 hover:text-red-400 text-sm mt-2 px-1">✕</button>
        </div>
      ))}
    </div>
  );
}
