import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Trash2, Edit2, Loader2, Calendar, HardDrive, Clock, Tag } from "lucide-react";
import { videosApi, projectsApi } from "../api";
import { useAuthStore } from "../stores/auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { formatBytes, formatDuration, formatDateTime } from "../lib/utils";
import type { Video, Project, Tag as TagType } from "../types";

export default function VideoPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    project_id: "",
    tagsInput: "",
  });
  const { user, canUpload, isAdmin } = useAuthStore();
  const navigate = useNavigate();

  const loadVideo = async () => {
    if (!id) return;
    try {
      const res = await videosApi.get(id);
      setVideo(res.data.data);
    } catch (err) {
      console.error("Load video error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideo();
  }, [id]);

  useEffect(() => {
    if (showEdit) {
      projectsApi.list().then((res) => setProjects(res.data.data));
    }
  }, [showEdit]);

  const openEdit = () => {
    if (!video) return;
    setEditForm({
      title: video.title,
      project_id: video.project_id || "",
      tagsInput: video.tags.map((t) => t.name).join(", "),
    });
    setShowEdit(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      const tags = editForm.tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await videosApi.update(id, {
        title: editForm.title,
        project_id: editForm.project_id || undefined,
        tags,
      });
      setShowEdit(false);
      loadVideo();
    } catch (err) {
      console.error("Update video error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !video) return;
    if (!confirm(`Supprimer "${video.title}" ? Cette action est irréversible.`)) return;
    try {
      await videosApi.delete(id);
      navigate("/videos");
    } catch (err) {
      console.error("Delete video error:", err);
    }
  };

  const canEdit = isAdmin() || (user?.id === video?.uploaded_by);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-semibold">Vidéo introuvable</h2>
        <Link to="/videos" className="text-sm text-muted-foreground hover:underline mt-2 inline-block">
          Retour aux vidéos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/videos" className="text-sm text-muted-foreground hover:underline flex items-center gap-1">
        <ArrowLeft className="h-3 w-3" /> Retour aux vidéos
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl overflow-hidden bg-black">
            <video
              controls
              className="w-full max-h-[70vh]"
              src={`/api/videos/${video.id}/stream`}
            >
              Votre navigateur ne prend pas en charge la lecture vidéo.
            </video>
          </div>

          <div className="flex items-center gap-2">
            <a href={`/api/videos/${video.id}/stream`} download>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" /> Télécharger
              </Button>
            </a>
            {canEdit && (
              <>
                <Button variant="outline" size="sm" onClick={openEdit}>
                  <Edit2 className="h-4 w-4 mr-2" /> Modifier
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Metadata Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{video.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Separator />

              <div className="grid grid-cols-2 gap-3 text-sm">
                {video.project_name && (
                  <div className="flex items-center gap-2">
                    <FolderIcon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Projet</p>
                      <p className="font-medium">{video.project_name}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Taille du fichier</p>
                    <p className="font-medium">{formatBytes(video.file_size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Durée</p>
                    <p className="font-medium">{formatDuration(video.duration)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Téléversé</p>
                    <p className="font-medium">{formatDateTime(video.created_at)}</p>
                  </div>
                </div>
              </div>

              {video.format && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Format : </span>
                  <span className="font-medium">{video.format}</span>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground mb-2">Téléversé par</p>
                <p className="text-sm font-medium">{video.uploaded_by_username}</p>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {video.tags.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Étiquettes</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {video.tags.map((tag) => (
                    <Badge key={tag.id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la vidéo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Titre</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Projet</Label>
              <Select
                value={editForm.project_id}
                onValueChange={(v) => setEditForm({ ...editForm, project_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un projet" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tags">Étiquettes (séparées par des virgules)</Label>
              <Input
                id="edit-tags"
                value={editForm.tagsInput}
                onChange={(e) => setEditForm({ ...editForm, tagsInput: e.target.value })}
                placeholder="ex. marketing, campagne, 2024"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEdit(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}
