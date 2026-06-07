import { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, Loader2, Shield, Upload } from "lucide-react";
import { usersApi } from "../api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { formatDate } from "../lib/utils";
import type { User } from "../types";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ email: "", password: "", role: "uploader" });
  const [creating, setCreating] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ email: "", password: "", role: "" });
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    try { const res = await usersApi.list(); setUsers(res.data.data); }
    catch (err) { console.error("Load users error:", err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true);
    try { await usersApi.create(createForm); setShowCreate(false); setCreateForm({ email: "", password: "", role: "uploader" }); loadUsers(); }
    catch (err: unknown) { const axiosErr = err as { response?: { data?: { error?: string } } }; alert(axiosErr.response?.data?.error || "Échec de la création"); }
    finally { setCreating(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editUser) return; setSaving(true);
    try {
      const data: { email?: string; password?: string; role?: string } = {};
      if (editForm.email && editForm.email !== editUser.email) data.email = editForm.email;
      if (editForm.password) data.password = editForm.password;
      if (editForm.role !== editUser.role) data.role = editForm.role;
      await usersApi.update(editUser.id, data); setEditUser(null); loadUsers();
    } catch (err: unknown) { const axiosErr = err as { response?: { data?: { error?: string } } }; alert(axiosErr.response?.data?.error || "Échec de la mise à jour"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Supprimer l'utilisateur "${user.email}" ?`)) return;
    try { await usersApi.delete(user.id); loadUsers(); }
    catch (err: unknown) { const axiosErr = err as { response?: { data?: { error?: string } } }; alert(axiosErr.response?.data?.error || "Échec de la suppression"); }
  };

  const openEdit = (user: User) => { setEditUser(user); setEditForm({ email: user.email, password: "", role: user.role }); };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-secondary" /></div>;

  const adminCount = users.filter((u) => u.role === "admin").length;
  const uploaderCount = users.filter((u) => u.role === "uploader").length;
  const inputCls = "bg-muted border-border text-foreground placeholder:text-muted-foreground/60 focus:border-secondary focus:ring-secondary/30";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground mt-0.5">{users.length} utilisateur{users.length !== 1 ? "s" : ""} &middot; {adminCount} admin &middot; {uploaderCount} uploader</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gradient-gold hover:opacity-90 text-secondary-foreground font-semibold shadow-lg glow-gold">
          <Plus className="h-4 w-4 mr-2" /> Ajouter un utilisateur
        </Button>
      </div>

      <div className="grid gap-3">
        {users.map((user) => (
          <Card key={user.id} className="border-border/50 bg-card card-hover">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center ${user.role === "admin" ? "gradient-primary" : "gradient-gold"}`}>
                  {user.role === "admin" ? <Shield className="h-4 w-4 text-white" /> : <Upload className="h-4 w-4 text-white" />}
                </div>
                <div>
                  <p className="font-medium text-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">Créé {formatDate(user.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={user.role === "admin" ? "gradient-primary text-white border-0" : "bg-secondary/15 text-secondary border border-secondary/25"}>
                  {user.role}
                </Badge>
                <Button variant="ghost" size="icon" onClick={() => openEdit(user)} className="text-muted-foreground hover:text-secondary"><Edit2 className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(user)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">Créer un utilisateur</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2"><Label className="text-muted-foreground">Adresse e-mail</Label><Input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} required className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-muted-foreground">Mot de passe</Label><Input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} required minLength={6} className={inputCls} /></div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Rôle</Label>
              <Select value={createForm.role} onValueChange={(v) => setCreateForm({ ...createForm, role: v })}>
                <SelectTrigger className="bg-muted border-border text-foreground"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="uploader">Uploader</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)} className="border-border text-muted-foreground">Annuler</Button>
              <Button type="submit" disabled={creating} className="gradient-primary hover:opacity-90 text-white">{creating && <Loader2 className="h-4 w-4 animate-spin" />} Créer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">Modifier l'utilisateur</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2"><Label className="text-muted-foreground">Adresse e-mail</Label><Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-muted-foreground">Nouveau mot de passe</Label><Input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} minLength={6} className={inputCls} /></div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Rôle</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger className="bg-muted border-border text-foreground"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="uploader">Uploader</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditUser(null)} className="border-border text-muted-foreground">Annuler</Button>
              <Button type="submit" disabled={saving} className="gradient-primary hover:opacity-90 text-white">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
