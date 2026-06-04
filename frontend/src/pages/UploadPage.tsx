import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Upload, X, Loader2, FileVideo, Plus, ChevronDown, ChevronUp, Check, AlertCircle, Trash2 } from "lucide-react";
import { videosApi, projectsApi, tagsApi } from "../api";
import { useAuthStore } from "../stores/auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import type { Project, Tag } from "../types";

interface UploadItem {
  id: string;
  file: File;
  title: string;
  description: string;
  project_id: string;
  tags: string[];
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
  overrideProject: boolean;
  overrideTags: boolean;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

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
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsRes, tagsRes] = await Promise.all([projectsApi.list(), tagsApi.list()]);
      setProjects(projectsRes.data.data);
      setExistingTags(tagsRes.data.data);
    } catch (err) {
      console.error("Load data error:", err);
    }
  };

  const addFiles = (files: FileList | File[]) => {
    const newItems: UploadItem[] = Array.from(files)
      .filter((f) => f.type.startsWith("video/"))
      .map((f) => ({
        id: generateId(),
        file: f,
        title: f.name.replace(/\.[^/.]+$/, ""),
        description: "",
        project_id: "",
        tags: [],
        status: "pending" as const,
        overrideProject: false,
        overrideTags: false,
      }));
    setItems((prev) => [...prev, ...newItems]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
      e.target.value = "";
    }
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const updateItem = (id: string, updates: Partial<UploadItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  };

  const toggleBulkTag = (tagId: string) => {
    setBulkTagIds((prev) => prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]);
  };

  const removeBulkTag = (tagId: string) => {
    setBulkTagIds((prev) => prev.filter((t) => t !== tagId));
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    setCreatingProject(true);
    try {
      const res = await projectsApi.create({ name: newProjectName.trim(), description: newProjectDesc.trim() || undefined });
      setProjects((prev) => [...prev, res.data.data]);
      setBulkProjectId(res.data.data.id);
      setShowNewProject(false);
      setNewProjectName("");
      setNewProjectDesc("");
    } catch (err) {
      console.error("Create project error:", err);
    } finally {
      setCreatingProject(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    setCreatingTag(true);
    try {
      const res = await tagsApi.create(newTagName.trim());
      setExistingTags((prev) => [...prev, res.data.data]);
      setBulkTagIds((prev) => [...prev, res.data.data.id]);
      setShowNewTag(false);
      setNewTagName("");
    } catch (err) {
      console.error("Create tag error:", err);
    } finally {
      setCreatingTag(false);
    }
  };

  const handleDeleteTag = async (id: string, name: string) => {
    if (!confirm(`Delete tag "${name}"?`)) return;
    try {
      await tagsApi.delete(id);
      setExistingTags((prev) => prev.filter((t) => t.id !== id));
      setBulkTagIds((prev) => prev.filter((t) => t !== id));
    } catch (err) {
      console.error("Delete tag error:", err);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Delete project "${name}" and all its videos?`)) return;
    try {
      await projectsApi.delete(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (bulkProjectId === id) setBulkProjectId("");
    } catch (err) {
      console.error("Delete project error:", err);
    }
  };

  const getEffectiveProjectId = (item: UploadItem) =>
    item.overrideProject && item.project_id ? item.project_id : bulkProjectId;

  const getEffectiveTagNames = (item: UploadItem) => {
    const tagIds = item.overrideTags ? item.tags : bulkTagIds;
    return tagIds.map((id) => existingTags.find((t) => t.id === id)?.name).filter(Boolean) as string[];
  };

  const handleUploadAll = async () => {
    setUploading(true);
    setUploadCount(0);
    const pendingItems = items.filter((i) => i.status === "pending");
    let completed = 0;

    for (const item of pendingItems) {
      updateItem(item.id, { status: "uploading" });
      const projectId = getEffectiveProjectId(item);
      const tagNames = getEffectiveTagNames(item);

      const formData = new FormData();
      formData.append("video", item.file);
      formData.append("title", item.title);
      formData.append("project_id", projectId);
      if (item.description) formData.append("description", item.description);
      formData.append("tags", JSON.stringify(tagNames));

      try {
        await videosApi.upload(formData);
        updateItem(item.id, { status: "done" });
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        updateItem(item.id, { status: "error", error: axiosErr.response?.data?.error || "Upload failed" });
      }
      completed++;
      setUploadCount(completed);
    }
    setUploading(false);
  };

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const doneCount = items.filter((i) => i.status === "done").length;
  const errorCount = items.filter((i) => i.status === "error").length;
  const allDone = items.length > 0 && items.every((i) => i.status === "done" || i.status === "error");
  const canUpload = pendingCount > 0 && bulkProjectId && !uploading;

  const selectedBulkTags = existingTags.filter((t) => bulkTagIds.includes(t.id));
  const canDeleteTag = (tag: Tag) => tag.created_by === user?.id || user?.role === "admin";
  const canDeleteProject = (proj: Project) => proj.created_by === user?.id || user?.role === "admin";

  return (
    <div className="flex gap-6 max-w-6xl mx-auto">
      {/* Left: Drop zone + Video list */}
      <div className="flex-1 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Upload Videos</h1>
          <p className="text-muted-foreground">Add multiple videos at once</p>
        </div>

        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept="video/*" multiple onChange={handleFileSelect} className="hidden" />
          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">Drop your videos here or click to browse</p>
          <p className="text-sm text-muted-foreground mt-1">Select multiple video files at once</p>
        </div>

        {/* Video List */}
        {items.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">
                {items.length} video{items.length !== 1 ? "s" : ""}
                {uploading && ` — ${uploadCount}/${items.length} uploaded`}
              </h2>
              {!uploading && items.some((i) => i.status === "pending") && (
                <Button variant="ghost" size="sm" onClick={() => setItems([])}>Clear all</Button>
              )}
            </div>

            {items.map((item) => {
              const isExpanded = expandedId === item.id;
              const effectiveProject = getEffectiveProjectId(item);
              const effectiveTagNames = getEffectiveTagNames(item);

              return (
                <Card key={item.id} className={item.status === "done" ? "opacity-60" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {item.status === "done" ? (
                        <Check className="h-5 w-5 text-green-500 shrink-0" />
                      ) : item.status === "error" ? (
                        <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                      ) : item.status === "uploading" ? (
                        <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                      ) : (
                        <FileVideo className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <Input
                          value={item.title}
                          onChange={(e) => updateItem(item.id, { title: e.target.value })}
                          className="h-7 text-sm"
                          disabled={item.status !== "pending"}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                          {effectiveProject && ` · ${projects.find((p) => p.id === effectiveProject)?.name || "Project"}`}
                          {effectiveTagNames.length > 0 && ` · ${effectiveTagNames.join(", ")}`}
                        </p>
                        {item.status === "error" && item.error && (
                          <p className="text-xs text-destructive mt-1">{item.error}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0"
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        disabled={item.status !== "pending"}>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      {item.status === "pending" && (
                        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => removeItem(item.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {isExpanded && item.status === "pending" && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Description</Label>
                          <Textarea value={item.description} onChange={(e) => updateItem(item.id, { description: e.target.value })} placeholder="Optional" rows={2} />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input type="checkbox" checked={item.overrideProject} onChange={(e) => updateItem(item.id, { overrideProject: e.target.checked, project_id: "" })} className="rounded" />
                            <Label className="text-xs">Override project</Label>
                          </div>
                          {item.overrideProject && (
                            <Select value={item.project_id} onValueChange={(v) => updateItem(item.id, { project_id: v })}>
                              <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                              <SelectContent>
                                {projects.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input type="checkbox" checked={item.overrideTags} onChange={(e) => updateItem(item.id, { overrideTags: e.target.checked, tags: [] })} className="rounded" />
                            <Label className="text-xs">Override tags</Label>
                          </div>
                          {item.overrideTags && (
                            <div className="flex flex-wrap gap-1.5">
                              {existingTags.map((tag) => (
                                <Badge
                                  key={tag.id}
                                  variant={item.tags.includes(tag.id) ? "default" : "outline"}
                                  className="cursor-pointer text-xs"
                                  onClick={() => {
                                    updateItem(item.id, {
                                      tags: item.tags.includes(tag.id)
                                        ? item.tags.filter((t) => t !== tag.id)
                                        : [...item.tags, tag.id],
                                    });
                                  }}
                                >
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

            <div className="flex items-center gap-4">
              {!allDone ? (
                <Button className="flex-1" disabled={!canUpload} onClick={handleUploadAll}>
                  {uploading ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />Uploading {uploadCount}/{items.length}...</>
                  ) : (
                    <><Upload className="h-4 w-4 mr-2" />Upload {pendingCount} Video{pendingCount !== 1 ? "s" : ""}</>
                  )}
                </Button>
              ) : (
                <div className="flex-1 flex items-center gap-3">
                  <p className="text-sm text-green-600 font-medium">
                    {doneCount} uploaded!{errorCount > 0 && ` (${errorCount} failed)`}
                  </p>
                  <Link to="/"><Button variant="outline">View My Videos</Button></Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right sidebar: Batch Settings */}
      <div className="w-72 shrink-0 space-y-4 hidden md:block">
        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Batch Settings</h2>

            {/* Project selector */}
            <div className="space-y-2">
              <Label className="text-xs">Project *</Label>
              <Select value={bulkProjectId} onValueChange={(v) => { setBulkProjectId(v); setShowNewProject(false); }}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <div key={p.id} className="flex items-center group">
                      <SelectItem value={p.id} className="flex-1">{p.name}</SelectItem>
                      {canDeleteProject(p) && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0 mr-1"
                          onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id, p.name); }}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <SelectItem value="__new__">+ Create new project</SelectItem>
                </SelectContent>
              </Select>
              {bulkProjectId === "__new__" && (
                <div className="space-y-2 pt-1">
                  <Input placeholder="Project name" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} />
                  <Input placeholder="Description (optional)" value={newProjectDesc} onChange={(e) => setNewProjectDesc(e.target.value)} />
                  <Button size="sm" className="w-full" onClick={handleCreateProject} disabled={creatingProject || !newProjectName.trim()}>
                    {creatingProject ? <Loader2 className="h-3 w-3 animate-spin" /> : "Create"}
                  </Button>
                </div>
              )}
            </div>

            {/* Tag selector - dropdown list like projects */}
            <div className="space-y-2">
              <Label className="text-xs">Tags</Label>
              {/* Selected tags */}
              {selectedBulkTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedBulkTags.map((tag) => (
                    <Badge key={tag.id} variant="secondary" className="cursor-pointer text-xs" onClick={() => removeBulkTag(tag.id)}>
                      {tag.name} <X className="h-2.5 w-2.5 ml-0.5" />
                    </Badge>
                  ))}
                </div>
              )}
              {/* Tag list with checkboxes */}
              <div className="border rounded-md max-h-48 overflow-y-auto">
                {existingTags.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-3">No tags yet</p>
                ) : (
                  existingTags.map((tag) => (
                    <div key={tag.id} className="flex items-center justify-between px-3 py-1.5 hover:bg-accent cursor-pointer group text-sm"
                      onClick={() => toggleBulkTag(tag.id)}>
                      <div className="flex items-center gap-2">
                        <div className={`h-3.5 w-3.5 rounded border flex items-center justify-center ${
                          bulkTagIds.includes(tag.id) ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40"
                        }`}>
                          {bulkTagIds.includes(tag.id) && <Check className="h-2.5 w-2.5" />}
                        </div>
                        <span>{tag.name}</span>
                      </div>
                      {canDeleteTag(tag) && (
                        <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0"
                          onClick={(e) => { e.stopPropagation(); handleDeleteTag(tag.id, tag.name); }}>
                          <Trash2 className="h-2.5 w-2.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
              {/* Create new tag */}
              {!showNewTag ? (
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setShowNewTag(true)}>
                  <Plus className="h-3 w-3 mr-1" /> Create new tag
                </Button>
              ) : (
                <div className="flex gap-1.5">
                  <Input placeholder="Tag name" value={newTagName} onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreateTag(); } }}
                    className="h-8 text-xs" />
                  <Button size="sm" onClick={handleCreateTag} disabled={creatingTag || !newTagName.trim()} className="h-8 shrink-0">
                    {creatingTag ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setShowNewTag(false); setNewTagName(""); }} className="h-8 shrink-0">
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
