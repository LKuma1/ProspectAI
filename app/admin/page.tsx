"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Profile = {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "user";
  status: "pending" | "active" | "blocked";
  created_at: string;
};

const STATUS_LABEL: Record<Profile["status"], string> = {
  pending: "Pendente",
  active: "Ativo",
  blocked: "Bloqueado",
};

const STATUS_CLASS: Record<Profile["status"], string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  blocked: "bg-rose-100 text-rose-800 border-rose-200",
};

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Profile["status"]>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setProfiles(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const updateStatus = async (id: string, status: Profile["status"]) => {
    setActionLoading(id + status);
    await supabase.from("profiles").update({ status }).eq("id", id);
    await fetchProfiles();
    setActionLoading(null);
  };

  const updateRole = async (id: string, role: Profile["role"]) => {
    setActionLoading(id + role);
    await supabase.from("profiles").update({ role }).eq("id", id);
    await fetchProfiles();
    setActionLoading(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const filtered =
    filter === "all" ? profiles : profiles.filter((p) => p.status === filter);

  const counts = {
    all: profiles.length,
    pending: profiles.filter((p) => p.status === "pending").length,
    active: profiles.filter((p) => p.status === "active").length,
    blocked: profiles.filter((p) => p.status === "blocked").length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">ProspectAI</span>
            <span className="text-slate-400 text-sm hidden sm:block">/ Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="text-slate-300 hover:text-white"
            >
              Ir para o App
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-300 hover:text-white"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              Gerenciar Usuários
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Aprove, bloqueie e gerencie o acesso à plataforma.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchProfiles}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(["all", "pending", "active", "blocked"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                filter === f
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {f === "all" ? "Todos" : STATUS_LABEL[f]}
              <span className="ml-2 text-xs opacity-70">({counts[f]})</span>
            </button>
          ))}
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              Carregando...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
              Nenhum usuário nesta categoria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-medium">Usuário</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Perfil</th>
                    <th className="px-6 py-4 font-medium">Cadastro</th>
                    <th className="px-6 py-4 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((profile) => (
                    <tr
                      key={profile.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">
                          {profile.name || "—"}
                        </div>
                        <div className="text-slate-400 text-xs mt-0.5">
                          {profile.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_CLASS[profile.status]}`}
                        >
                          {profile.status === "pending" && <Clock className="w-3 h-3" />}
                          {profile.status === "active" && <CheckCircle2 className="w-3 h-3" />}
                          {profile.status === "blocked" && <XCircle className="w-3 h-3" />}
                          {STATUS_LABEL[profile.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          {profile.role === "admin" && (
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                          )}
                          {profile.role === "admin" ? "Admin" : "Usuário"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(profile.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-end flex-wrap">
                          {profile.status !== "active" && (
                            <Button
                              size="sm"
                              onClick={() => updateStatus(profile.id, "active")}
                              disabled={!!actionLoading}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                            >
                              Aprovar
                            </Button>
                          )}
                          {profile.status !== "blocked" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(profile.id, "blocked")}
                              disabled={!!actionLoading}
                              className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs"
                            >
                              Bloquear
                            </Button>
                          )}
                          {profile.status === "blocked" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(profile.id, "pending")}
                              disabled={!!actionLoading}
                              className="text-xs"
                            >
                              Desbloquear
                            </Button>
                          )}
                          {profile.role !== "admin" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateRole(profile.id, "admin")}
                              disabled={!!actionLoading}
                              className="border-blue-200 text-blue-600 hover:bg-blue-50 text-xs"
                            >
                              Tornar Admin
                            </Button>
                          )}
                          {profile.role === "admin" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateRole(profile.id, "user")}
                              disabled={!!actionLoading}
                              className="text-xs"
                            >
                              Remover Admin
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
