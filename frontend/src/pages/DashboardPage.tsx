import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Video,
  FolderOpen,
  Tag,
  HardDrive,
  Trash2,
  Upload,
  Search,
  Loader2,
  CheckSquare,
  Square,
} from "lucide-react";
import { statsApi, videosApi, projectsApi, tagsApi } from "../api";
import { useAuthStore } from "../stores/auth";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { formatBytes, formatDuration } from "../lib/utils";
import type { MyStats, Video as VideoType, Project, Tag as TagType } from "../types";

export default function DashboardPage() {
  const [stats, setStats] = useState<MyStats | null>(null);
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { canUpload, user } = useAuthStore();

  const loadDashboard = useCallback(async () => {
    try {
      const [statsRes, videosRes, projectsRes, tagsRes] = await Promise.all([
        statsApi.getMine(),
        videosApi.list({
          limit: 20,
          sort_by: "created_at",
          sort_order: "desc",
          uploaded_by: user?.id,
          search: searchQuery || undefined,
        }),
        projectsApi.list(),
        tagsApi.list(),
      ]);
      setStats(statsRes.data.data);
      setVideos(videosRes.data.data);
      setPagination(videosRes.data.pagination);
      setProjects(projectsRes.data.data);
      setTags(tagsRes.data.data);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, searchQuery]);

  useEffect(() => {
    if (user?.id) loadDashboard();
  }, [loadDashboard, user?.id]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === videos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(videos.map((v) => v.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Supprimer ${selectedIds.size} vidéo(s) ? Cette action est irréversible.`)) return;
    setDeleting(true);
    try {
      await videosApi.batchDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
      loadDashboard();
    } catch (err) {
      console.error("Batch delete error:", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteVideo = async (id: string, title: string) => {
    if (!confirm(`Supprimer "${title}" ? Cette action est irréversible.`)) return;
    setDeleting(true);
    try {
      await videosApi.delete(id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      loadDashboard();
    } catch (err) {
      console.error("Delete video error:", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setSelectedIds(new Set());
  };

  const canDeleteTag = (tag: TagType) => tag.created_by === user?.id || user?.role === "admin";
  const canDeleteProject = (proj: Project) => proj.created_by === user?.id || user?.role === "admin";

  const handleDeleteTag = async (id: string, name: string) => {
    if (!confirm(`Supprimer l'étiquette "${name}" ?`)) return;
    try {
      const { tagsApi } = await import("../api");
      await tagsApi.delete(id);
      loadDashboard();
    } catch (err) {
      console.error("Delete tag error:", err);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Supprimer le projet "${name}" et toutes ses vidéos ?`)) return;
    try {
      const { projectsApi } = await import("../api");
      await projectsApi.delete(id);
      loadDashboard();
    } catch (err) {
      console.error("Delete project error:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }

  const statCards = [
    { label: "Mes vidéos", value: stats?.total_videos ?? 0, icon: Video, gradient: "gradient-primary", glow: "glow-primary" },
    { label: "Mes projets", value: stats?.total_projects ?? 0, icon: FolderOpen, gradient: "gradient-gold", glow: "glow-gold" },
    { label: "Mes étiquettes", value: stats?.total_tags ?? 0, icon: Tag, gradient: "from-purple-500 to-purple-700", glow: "" },
    { label: "Mon stockage", value: stats?.total_storage_human ?? "0 B", icon: HardDrive, gradient: "from-emerald-500 to-emerald-700", glow: "" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mon tableau de bord</h1>
          <p className="text-muted-foreground mt-0.5">Vos vidéos, statistiques et paramètres</p>
        </div>
        {canUpload() && (
          <Link to="/upload">
            <Button className="gradient-gold hover:opacity-90 text-secondary-foreground font-semibold shadow-lg glow-gold">
              <Upload className="h-4 w-4 mr-2" /> Téléverser des vidéos
            </Button>
          </Link>
        )}
      </div>

      {/* ── Stats ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="card-hover border-border/50 bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-md ${stat.glow}`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Projects & Tags side by side ───────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Projects */}
        <Card className="border-border/50 bg-card">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3 text-secondary">Projets ({projects.length})</h3>
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun projet pour l'instant</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
                {projects.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-accent group transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <FolderOpen className="h-3.5 w-3.5 text-secondary shrink-0" />
                      <span className="text-sm truncate">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-secondary bg-secondary/10 border border-secondary/20 rounded-full px-2 py-0.5">{p.video_count ?? 0}</span>
                      {canDeleteProject(p) && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0 hover:text-destructive" onClick={() => handleDeleteProject(p.id, p.name)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tags */}
        <Card className="border-border/50 bg-card">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3 text-secondary">Étiquettes ({tags.length})</h3>
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune étiquette pour l'instant</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto scrollbar-thin">
                {tags.map((t) => (
                  <Badge
                    key={t.id}
                    variant="secondary"
                    className="group relative pr-6 bg-secondary/15 text-secondary border border-secondary/25 hover:bg-secondary/25 transition-colors"
                  >
                    {t.name}
                    {canDeleteTag(t) && (
                      <button
                        className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 hover:text-destructive transition-colors"
                        onClick={() => handleDeleteTag(t.id, t.name)}
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── My Videos ──────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Mes vidéos ({pagination.total})</h2>
          {selectedIds.size > 0 && (
            <Button variant="destructive" size="sm" onClick={handleDeleteSelected} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Supprimer ({selectedIds.size})
            </Button>
          )}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 h-10 bg-muted border-border text-foreground placeholder:text-muted-foreground/60 focus:border-secondary focus:ring-secondary/30"
              placeholder="Rechercher vos vidéos..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Button type="submit" variant="outline" className="h-10 border-secondary/40 text-secondary hover:bg-secondary/10 hover:text-secondary">Rechercher</Button>
        </form>

        {videos.length === 0 ? (
          <Card className="border-border/50 bg-card">
            <CardContent className="p-12 text-center">
              <Video className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">Aucune vidéo pour l'instant. Téléversez votre première vidéo !</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Select all row */}
            <div className="flex items-center gap-2 px-1">
              <button onClick={toggleSelectAll} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-secondary transition-colors">
                {selectedIds.size === videos.length ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                Tout sélectionner
              </button>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {videos.map((video) => (
                <div key={video.id} className="relative group">
                  {/* Selection checkbox */}
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSelect(video.id); }}
                    className={`absolute top-2 left-2 z-10 rounded-md p-0.5 transition-all duration-200 ${
                      selectedIds.has(video.id) ? "bg-primary text-white shadow-sm" : "bg-black/50 text-white opacity-0 group-hover:opacity-100"
                    }`}
                    style={{ opacity: selectedIds.has(video.id) ? 1 : undefined }}
                  >
                    {selectedIds.has(video.id) ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteVideo(video.id, video.title); }}
                    className="absolute top-2 right-2 z-10 rounded-md bg-destructive/90 text-destructive-foreground p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-destructive shadow-sm"
                    disabled={deleting}
                    title="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  <Link to={`/videos/${video.id}`}>
                    <Card className={`overflow-hidden transition-all duration-200 cursor-pointer bg-card border-border/50 ${
                      selectedIds.has(video.id) ? "ring-2 ring-primary shadow-lg" : "card-hover"
                    }`}>
                      <div className="aspect-video bg-muted relative overflow-hidden">
                        <img
                          src={`/api/videos/${video.id}/thumbnail`}
                          alt={video.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {video.duration && (
                          <span className="absolute bottom-1.5 right-1.5 bg-black/75 text-white text-xs px-1.5 py-0.5 rounded-md font-medium">
                            {formatDuration(video.duration)}
                          </span>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-medium text-sm truncate text-foreground">{video.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {video.project_name || "Sans projet"} &middot; {formatBytes(video.file_size)}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button variant="outline" size="sm" disabled={pagination.page <= 1}
                  onClick={() => {
                    setLoading(true);
                    videosApi.list({ page: pagination.page - 1, limit: 20, sort_by: "created_at", sort_order: "desc", uploaded_by: user?.id, search: searchQuery || undefined })
                      .then((res) => { setVideos(res.data.data); setPagination(res.data.pagination); setSelectedIds(new Set()); })
                      .finally(() => setLoading(false));
                  }}
                  className="border-border text-muted-foreground hover:text-secondary hover:border-secondary/40"
                >
                  Précédent
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} sur {pagination.totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages}
                  onClick={() => {
                    setLoading(true);
                    videosApi.list({ page: pagination.page + 1, limit: 20, sort_by: "created_at", sort_order: "desc", uploaded_by: user?.id, search: searchQuery || undefined })
                      .then((res) => { setVideos(res.data.data); setPagination(res.data.pagination); setSelectedIds(new Set()); })
                      .finally(() => setLoading(false));
                  }}
                  className="border-border text-muted-foreground hover:text-secondary hover:border-secondary/40"
                >
                  Suivant
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
