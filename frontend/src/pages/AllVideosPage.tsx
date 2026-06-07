import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, Video, Loader2, SlidersHorizontal } from "lucide-react";
import { videosApi, projectsApi, tagsApi, usersApi } from "../api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { formatBytes, formatDuration } from "../lib/utils";
import type { Video as VideoType, Project, Tag, User, VideoFilters } from "../types";

export default function AllVideosPage() {
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<VideoFilters>({ page: 1, limit: 20, sort_by: "created_at", sort_order: "desc" });
  const [searchInput, setSearchInput] = useState("");

  const loadVideos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await videosApi.list(filters);
      setVideos(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error("Load videos error:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadVideos(); }, [loadVideos]);

  useEffect(() => {
    async function loadFilters() {
      try {
        const [projectsRes, tagsRes, usersRes] = await Promise.all([projectsApi.list(), tagsApi.list(), usersApi.list().catch(() => ({ data: { data: [] } }))]);
        setProjects(projectsRes.data.data);
        setTags(tagsRes.data.data);
        setUsers(usersRes.data.data);
      } catch (err) { console.error("Load filters error:", err); }
    }
    loadFilters();
  }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setFilters({ ...filters, search: searchInput, page: 1 }); };
  const clearFilters = () => { setFilters({ page: 1, limit: 20, sort_by: "created_at", sort_order: "desc" }); setSearchInput(""); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Toutes les vidéos</h1>
          <p className="text-muted-foreground mt-0.5">
            {pagination.total} vidéo{pagination.total !== 1 ? "s" : ""} téléversées par tout le monde
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}
          className="border-secondary/40 text-secondary hover:bg-secondary/10 hover:text-secondary">
          <SlidersHorizontal className="h-4 w-4 mr-2" /> Filtres
        </Button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9 h-10 bg-muted border-border text-foreground placeholder:text-muted-foreground/60 focus:border-secondary focus:ring-secondary/30"
            placeholder="Rechercher des vidéos par titre..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        </div>
        <Button type="submit" className="gradient-primary hover:opacity-90 text-white shadow-md">Rechercher</Button>
      </form>

      {showFilters && (
        <Card className="border-border/50 bg-card">
          <CardContent className="p-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-secondary">Projet</label>
                <Select value={filters.project_id || "all"} onValueChange={(v) => setFilters({ ...filters, project_id: v === "all" ? undefined : v, page: 1 })}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Tous les projets" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les projets</SelectItem>
                    {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-secondary">Étiquette</label>
                <Select value={filters.tag || "all"} onValueChange={(v) => setFilters({ ...filters, tag: v === "all" ? undefined : v, page: 1 })}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Toutes les étiquettes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les étiquettes</SelectItem>
                    {tags.map((t) => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-secondary">Téléverseur</label>
                <Select value={filters.uploaded_by || "all"} onValueChange={(v) => setFilters({ ...filters, uploaded_by: v === "all" ? undefined : v, page: 1 })}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Tous les utilisateurs" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les utilisateurs</SelectItem>
                    {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-secondary">Trier par</label>
                <Select value={filters.sort_by} onValueChange={(v) => setFilters({ ...filters, sort_by: v as VideoFilters["sort_by"], page: 1 })}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Date</SelectItem>
                    <SelectItem value="title">Titre</SelectItem>
                    <SelectItem value="file_size">Taille du fichier</SelectItem>
                    <SelectItem value="duration">Durée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-secondary">Ordre</label>
                <Select value={filters.sort_order} onValueChange={(v) => setFilters({ ...filters, sort_order: v as "asc" | "desc", page: 1 })}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Plus récents d'abord</SelectItem>
                    <SelectItem value="asc">Plus anciens d'abord</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-secondary">Réinitialiser les filtres</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-secondary" /></div>
      ) : videos.length === 0 ? (
        <Card className="border-border/50 bg-card">
          <CardContent className="p-12 text-center">
            <Video className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="font-semibold text-lg text-foreground">Aucune vidéo trouvée</h3>
            <p className="text-muted-foreground mt-1">
              {filters.search || filters.project_id || filters.tag ? "Essayez d'ajuster votre recherche ou vos filtres." : "Aucune vidéo n'a encore été téléversée."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {videos.map((video) => (
              <Link key={video.id} to={`/videos/${video.id}`}>
                <Card className="overflow-hidden transition-all duration-200 cursor-pointer bg-card border-border/50 card-hover">
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    <img src={`/api/videos/${video.id}/thumbnail`} alt={video.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
                    {video.duration && (
                      <span className="absolute bottom-1.5 right-1.5 bg-black/75 text-white text-xs px-1.5 py-0.5 rounded-md font-medium">
                        {formatDuration(video.duration)}
                      </span>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm truncate text-foreground">{video.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{video.uploaded_by_email} &middot; {formatBytes(video.file_size)}</p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {video.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag.id} variant="secondary" className="text-[10px] px-1.5 py-0 bg-secondary/15 text-secondary border border-secondary/25">{tag.name}</Badge>
                      ))}
                      {video.tags.length > 3 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">+{video.tags.length - 3}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" disabled={pagination.page <= 1}
                onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                className="border-border text-muted-foreground hover:text-secondary hover:border-secondary/40">Précédent</Button>
              <span className="text-sm text-muted-foreground">Page {pagination.page} sur {pagination.totalPages}</span>
              <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages}
                onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                className="border-border text-muted-foreground hover:text-secondary hover:border-secondary/40">Suivant</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
