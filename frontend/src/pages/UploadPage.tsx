import { useState, useEffect, useRef } from "react";
import { Upload, X, Loader2, FileVideo, Plus, ChevronDown, ChevronUp, AlertCircle, Trash2, Check } from "lucide-react";
import { videosApi, projectsApi, tagsApi } from "../api";
import { useAuthStore } from "../stores/auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import type { Project, Tag } from "../types";

interface UploadItem {
  id: string; file: File; title: string; project_id: string; tags: string[];
  status: "pending" | "uploading" | "done" | "error"; error?: string;
  overrideProject: boolean; overrideTags: boolean;
}

function generateId(): string { return Math.random().toString(36).substring(2, 9); }

export default function UploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [bulkProjectId, setBulkProjectId] = useState("");
  const [bulkTagIds, setBulkTagIds] = useState<string[]>([]);
  const [existingTags, setExistingTags] = useState<Tag[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [projectsRes, tagsRes] = await Promise.all([projectsApi.list(), tagsApi.list()]);
      setProjects(projectsRes.data.data); setExistingTags(tagsRes.data.data);
    } catch (err) { console.error("Load data error:", err); }
  };

  const addFiles = (files: FileList | File[]) => {
    const newItems: UploadItem[] = Array.from(files).filter((f) => f.type.startsWith("video/")).map((f) => ({
      id: generateId(), file: f, title: f.name.replace(/\.[^/.]+$/, ""), project_id: "", tags: [],
      status: "pending" as const, overrideProject: false, overrideTags: false,
    }));
    setItems((prev) => [...prev, ...newItems]);
  };

  const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.type === "dragenter" || e.type === "dragover") setDragActive(true); else if (e.type === "dragleave") setDragActive(false); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files) addFiles(e.dataTransfer.files); };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) { addFiles(e.target.files); e.target.value = ""; } };
  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const updateItem = (id: string, updates: Partial<UploadItem>) => { setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i))); };
  const toggleBulkTag = (tagId: string) => { setBulkTagIds((prev) => prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]); };
  const removeBulkTag = (tagId: string) => { setBulkTagIds((prev) => prev.filter((t) => t !== tagId)); };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    setCreatingProject(true);
    try {
      const res = await projectsApi.create({ name: newProjectName.trim() });
      setProjects((prev) => [...prev, res.data.data]); setBulkProjectId(res.data.data.id);
      setShowNewProject(false); setNewProjectName("");
    } catch (err) { console.error("Create project error:", err); }
    finally { setCreatingProject(false); }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    setCreatingTag(true);
    try {
      const res = await tagsApi.create(newTagName.trim());
      setExistingTags((prev) => [...prev, res.data.data]); setBulkTagIds((prev) => [...prev, res.data.data.id]);
      setShowNewTag(false); setNewTagName("");
    } catch (err) { console.error("Create tag error:", err); }
    finally { setCreatingTag(false); }
  };

  const handleDeleteTag = async (id: string, name: string) => {
    if (!confirm(`Supprimer l'étiquette "${name}" ?`)) return;
    try { await tagsApi.delete(id); setExistingTags((prev) => prev.filter((t) => t.id !== id)); setBulkTagIds((prev) => prev.filter((t) => t !== id)); }
    catch (err) { console.error("Delete tag error:", err); }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Supprimer le projet "${name}" et toutes ses vidéos ?`)) return;
    try { await projectsApi.delete(id); setProjects((prev) => prev.filter((p) => p.id !== id)); if (bulkProjectId === id) setBulkProjectId(""); }
    catch (err) { console.error("Delete project error:", err); }
  };

  const getEffectiveProjectId = (item: UploadItem) => item.overrideProject && item.project_id ? item.project_id : bulkProjectId;
  const getEffectiveTagNames = (item: UploadItem) => {
    const tagIds = item.overrideTags ? item.tags : bulkTagIds;
    return tagIds.map((id) => existingTags.find((t) => t.id === id)?.name).filter(Boolean) as string[];
  };

  const handleUploadAll = async () => {
    setUploading(true); setUploadCount(0);
    const pendingItems = items.filter((i) => i.status === "pending");
    let completed = 0;
    let failCount = 0;
    for (const item of pendingItems) {
      updateItem(item.id, { status: "uploading" });
      const projectId = getEffectiveProjectId(item);
      const tagNames = getEffectiveTagNames(item);
      const formData = new FormData();
      formData.append("video", item.file); formData.append("title", item.title);
      formData.append("project_id", projectId || ""); formData.append("tags", JSON.stringify(tagNames));
      try { await videosApi.upload(formData); updateItem(item.id, { status: "done" }); }
      catch (err: unknown) { const axiosErr = err as { response?: { data?: { error?: string } } }; updateItem(item.id, { status: "error", error: axiosErr.response?.data?.error || "Échec du téléversement" }); failCount++; }
      completed++; setUploadCount(completed);
    }
    setUploading(false);
    if (completed > 0 && failCount === 0) {
      setShowSuccess(true);
      setTimeout(() => { setItems([]); setShowSuccess(false); }, 2500);
    } else if (failCount > 0 && failCount < completed) {
      setTimeout(() => setItems((prev) => prev.filter((i) => i.status === "error")), 1500);
    }
  };

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const doneCount = items.filter((i) => i.status === "done").length;
  const errorCount = items.filter((i) => i.status === "error").length;
  const canUpload = pendingCount > 0 && !uploading;
  const selectedBulkTags = existingTags.filter((t) => bulkTagIds.includes(t.id));
  const canDeleteTag = (tag: Tag) => tag.created_by === user?.id || user?.role === "admin";
  const canDeleteProject = (proj: Project) => proj.created_by === user?.id || user?.role === "admin";

  const inputCls = "bg-muted border-border text-foreground placeholder:text-muted-foreground/60 focus:border-secondary focus:ring-secondary/30";

  return (
    <div className="flex gap-6 max-w-6xl mx-auto relative">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-lg px-5 py-3.5 shadow-2xl">
            <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Check className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-300">Téléversement terminé !</p>
              <p className="text-xs text-emerald-400/70">Toutes les vidéos ont été téléversées avec succès</p>
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Téléverser des vidéos</h1>
          <p className="text-muted-foreground mt-0.5">Ajoutez plusieurs vidéos à la fois</p>
        </div>

        {/* Drop Zone */}
        <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
          dragActive ? "border-secondary bg-secondary/5 glow-gold" : "border-border hover:border-secondary/60 hover:bg-accent/30"
        }`}
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}>
          <input ref={fileInputRef} type="file" accept="video/*" multiple onChange={handleFileSelect} className="hidden" />
          <div className="h-14 w-14 rounded-2xl gradient-gold mx-auto flex items-center justify-center shadow-lg glow-gold mb-4">
            <Upload className="h-7 w-7 text-secondary-foreground" />
          </div>
          <p className="font-medium text-foreground">Déposez vos vidéos ici ou cliquez pour parcourir</p>
          <p className="text-sm text-muted-foreground mt-1">Sélectionnez plusieurs fichiers vidéo à la fois</p>
        </div>

        {items.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">{items.length} vidéo{items.length !== 1 ? "s" : ""}{uploading && ` — ${uploadCount}/${items.length} téléversé(s)`}</h2>
              <div className="flex items-center gap-2">
                {items.some((i) => i.status === "pending") && (
                  <Button className="gradient-gold hover:opacity-90 text-secondary-foreground font-semibold shadow-lg glow-gold" disabled={!canUpload} onClick={handleUploadAll}>
                    {uploading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Téléversement {uploadCount}...</>
                      : <><Upload className="h-4 w-4 mr-2" />Téléverser {pendingCount} vidéo{pendingCount !== 1 ? "s" : ""}</>}
                  </Button>
                )}
                {!uploading && items.some((i) => i.status === "pending") && (
                  <Button variant="ghost" size="sm" onClick={() => setItems([])} className="text-muted-foreground hover:text-secondary">Tout effacer</Button>
                )}
                {errorCount > 0 && !uploading && (
                  <Button variant="ghost" size="sm" onClick={() => setItems((prev) => prev.filter((i) => i.status !== "error"))} className="text-muted-foreground hover:text-secondary">
                    Effacer les échoués
                  </Button>
                )}
              </div>
            </div>

            {items.map((item) => {
              const isExpanded = expandedId === item.id;
              const effectiveProject = getEffectiveProjectId(item);
              const effectiveTagNames = getEffectiveTagNames(item);
              return (
                <Card key={item.id} className={`border-border/50 bg-card transition-opacity ${item.status === "done" ? "opacity-60" : ""} ${item.status === "error" ? "border-destructive/30" : ""} ${item.status === "done" ? "border-emerald-500/30" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {item.status === "done" ? <Check className="h-5 w-5 text-emerald-400 shrink-0" />
                        : item.status === "error" ? <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                        : item.status === "uploading" ? <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
                        : <FileVideo className="h-5 w-5 text-secondary shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <Input value={item.title} onChange={(e) => updateItem(item.id, { title: e.target.value })}
                          className="h-7 text-sm bg-muted border-border text-foreground" disabled={item.status !== "pending"} />
                        <p className="text-xs text-muted-foreground mt-1">
                          {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                          {effectiveProject && ` · ${projects.find((p) => p.id === effectiveProject)?.name || "Projet"}`}
                          {effectiveTagNames.length > 0 && ` · ${effectiveTagNames.join(", ")}`}
                        </p>
                        {item.status === "error" && item.error && <p className="text-xs text-destructive mt-1">{item.error}</p>}
                      </div>
                      {item.status === "pending" && <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground" onClick={() => setExpandedId(isExpanded ? null : item.id)} disabled={item.status !== "pending"}>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>}
                      {item.status === "pending" && (
                        <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-secondary" onClick={() => removeItem(item.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {isExpanded && item.status === "pending" && (
                      <div className="mt-4 pt-4 border-t border-border space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input type="checkbox" checked={item.overrideProject} onChange={(e) => updateItem(item.id, { overrideProject: e.target.checked, project_id: "" })} className="rounded accent-secondary" />
                            <Label className="text-xs text-muted-foreground">Remplacer le projet</Label>
                          </div>
                          {item.overrideProject && (
                            <Select value={item.project_id} onValueChange={(v) => updateItem(item.id, { project_id: v })}>
                              <SelectTrigger className="bg-muted border-border text-foreground"><SelectValue placeholder="Sélectionner un projet" /></SelectTrigger>
                              <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                            </Select>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input type="checkbox" checked={item.overrideTags} onChange={(e) => updateItem(item.id, { overrideTags: e.target.checked, tags: [] })} className="rounded accent-secondary" />
                            <Label className="text-xs text-muted-foreground">Remplacer les étiquettes</Label>
                          </div>
                          {item.overrideTags && (
                            <div className="flex flex-wrap gap-1.5">
                              {existingTags.map((tag) => (
                                <Badge key={tag.id} variant={item.tags.includes(tag.id) ? "default" : "outline"}
                                  className="cursor-pointer text-xs" onClick={() => updateItem(item.id, { tags: item.tags.includes(tag.id) ? item.tags.filter((t) => t !== tag.id) : [...item.tags, tag.id] })}>
                                  {tag.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}


          </div>
        )}
      </div>

      {/* Right sidebar */}
      <div className="w-72 shrink-0 space-y-4 hidden md:block">
        <Card className="border-border/50 bg-card">
          <CardContent className="p-4 space-y-4">
            <h2 className="font-semibold text-xs text-secondary uppercase tracking-wide">Paramètres par lot</h2>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Projet</Label>
              <Select value={bulkProjectId} onValueChange={(v) => { setBulkProjectId(v); setShowNewProject(false); }}>
                <SelectTrigger className="bg-muted border-border text-foreground"><SelectValue placeholder="Sélectionner un projet" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <div key={p.id} className="flex items-center group">
                      <SelectItem value={p.id} className="flex-1">{p.name}</SelectItem>
                      {canDeleteProject(p) && <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0 mr-1"
                        onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id, p.name); }}><Trash2 className="h-3 w-3 text-destructive" /></Button>}
                    </div>
                  ))}
                  <SelectItem value="__new__">+ Créer un nouveau projet</SelectItem>
                </SelectContent>
              </Select>
              {bulkProjectId === "__new__" && (
                <div className="space-y-2 pt-1">
                  <Input placeholder="Nom du projet" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} className={inputCls} />
                  <Button size="sm" className="w-full gradient-primary hover:opacity-90 text-white" onClick={handleCreateProject} disabled={creatingProject || !newProjectName.trim()}>
                    {creatingProject ? <Loader2 className="h-3 w-3 animate-spin" /> : "Créer"}
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Étiquettes</Label>
              {selectedBulkTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedBulkTags.map((tag) => (
                    <Badge key={tag.id} variant="secondary" className="cursor-pointer text-xs bg-secondary/15 text-secondary border border-secondary/25"
                      onClick={() => removeBulkTag(tag.id)}>{tag.name} <X className="h-2.5 w-2.5 ml-0.5" /></Badge>
                  ))}
                </div>
              )}
              <div className="border border-border rounded-md max-h-48 overflow-y-auto scrollbar-thin">
                {existingTags.length === 0 ? <p className="text-xs text-muted-foreground p-3">Aucune étiquette</p>
                  : existingTags.map((tag) => (
                    <div key={tag.id} className="flex items-center justify-between px-3 py-1.5 hover:bg-accent cursor-pointer group text-sm transition-colors"
                      onClick={() => toggleBulkTag(tag.id)}>
                      <div className="flex items-center gap-2">
                        <div className={`h-3.5 w-3.5 rounded border flex items-center justify-center transition-colors ${
                          bulkTagIds.includes(tag.id) ? "bg-primary border-primary text-white" : "border-muted-foreground/40"}`}>
                          {bulkTagIds.includes(tag.id) && <Check className="h-2.5 w-2.5" />}
                        </div>
                        <span className="text-foreground">{tag.name}</span>
                      </div>
                      {canDeleteTag(tag) && <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0"
                        onClick={(e) => { e.stopPropagation(); handleDeleteTag(tag.id, tag.name); }}><Trash2 className="h-2.5 w-2.5 text-destructive" /></Button>}
                    </div>
                  ))}
              </div>
              {!showNewTag ? (
                <Button variant="outline" size="sm" className="w-full text-xs border-secondary/40 text-secondary hover:bg-secondary/10" onClick={() => setShowNewTag(true)}>
                  <Plus className="h-3 w-3 mr-1" /> Créer une nouvelle étiquette
                </Button>
              ) : (
                <div className="flex gap-1.5">
                  <Input placeholder="Nom de l'étiquette" value={newTagName} onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreateTag(); } }} className={`h-8 text-xs ${inputCls}`} />
                  <Button size="sm" onClick={handleCreateTag} disabled={creatingTag || !newTagName.trim()} className="h-8 shrink-0 gradient-primary hover:opacity-90 text-white">
                    {creatingTag ? <Loader2 className="h-3 w-3 animate-spin" /> : "Ajouter"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setShowNewTag(false); setNewTagName(""); }} className="h-8 shrink-0 text-muted-foreground">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
