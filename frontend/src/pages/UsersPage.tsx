import { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, Loader2, Users as UsersIcon, Shield, Upload } from "lucide-react";
import { usersApi } from "../api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { formatDate } from "../lib/utils";
import type { User } from "../types";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ username: "", password: "", role: "uploader" });
  const [creating, setCreating] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ username: "", password: "", role: "" });
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    try {
      const res = await usersApi.list();
      setUsers(res.data.data);
    } catch (err) {
      console.error("Load users error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await usersApi.create(createForm);
      setShowCreate(false);
      setCreateForm({ username: "", password: "", role: "uploader" });
      loadUsers();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      alert(axiosErr.response?.data?.error || "Échec de la création de l'utilisateur");
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setSaving(true);
    try {
      const data: { username?: string; password?: string; role?: string } = {};
      if (editForm.username && editForm.username !== editUser.username) data.username = editForm.username;
      if (editForm.password) data.password = editForm.password;
      if (editForm.role !== editUser.role) data.role = editForm.role;
      await usersApi.update(editUser.id, data);
      setEditUser(null);
      loadUsers();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      alert(axiosErr.response?.data?.error || "Échec de la mise à jour de l'utilisateur");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Supprimer l'utilisateur "${user.username}" ?`)) return;
    try {
      await usersApi.delete(user.id);
      loadUsers();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      alert(axiosErr.response?.data?.error || "Échec de la suppression de l'utilisateur");
    }
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    setEditForm({ username: user.username, password: "", role: user.role });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const adminCount = users.filter((u) => u.role === "admin").length;
  const uploaderCount = users.filter((u) => u.role === "uploader").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground">
            {users.length} utilisateur{users.length !== 1 ? "s" : ""} &middot; {adminCount} admin &middot; {uploaderCount} uploader
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> Ajouter un utilisateur
        </Button>
      </div>

      <div className="grid gap-3">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
                  {user.role === "admin" ? (
                    <Shield className="h-4 w-4" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{user.username}</p>
                  <p className="text-xs text-muted-foreground">Créé {formatDate(user.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                  {user.role}
                </Badge>
                <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(user)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create User Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un utilisateur</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-username">Nom d'utilisateur</Label>
              <Input
                id="create-username"
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Mot de passe</Label>
              <Input
                id="create-password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select
                value={createForm.role}
                onValueChange={(v) => setCreateForm({ ...createForm, role: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uploader">Uploader</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">Nom d'utilisateur</Label>
              <Input
                id="edit-username"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Nouveau mot de passe (laisser vide pour conserver l'actuel)</Label>
              <Input
                id="edit-password"
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select
                value={editForm.role}
                onValueChange={(v) => setEditForm({ ...editForm, role: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uploader">Uploader</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditUser(null)}>
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
