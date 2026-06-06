import { useState } from "react";
import { KeyRound, Loader2, Eye, EyeOff } from "lucide-react";
import { authApi } from "../api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (newPassword !== confirmPassword) {
      setErrorMsg("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMsg("Le nouveau mot de passe doit être différent du mot de passe actuel.");
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setSuccessMsg("Mot de passe modifié avec succès.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setErrorMsg(axiosErr.response?.data?.error || "Échec du changement de mot de passe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Changer le mot de passe
          </CardTitle>
          <CardDescription>Mettre à jour votre mot de passe</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Mot de passe actuel</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowCurrent(!showCurrent)}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNew(!showNew)}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Minimum 6 caractères</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {errorMsg && (
              <p className="text-sm text-destructive">{errorMsg}</p>
            )}

            {successMsg && (
              <p className="text-sm text-green-600">{successMsg}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Modification...</>
              ) : (
                "Changer le mot de passe"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
