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
    e.preventDefault(); setErrorMsg(""); setSuccessMsg("");
    if (newPassword !== confirmPassword) { setErrorMsg("Les nouveaux mots de passe ne correspondent pas."); return; }
    if (newPassword.length < 6) { setErrorMsg("Le nouveau mot de passe doit contenir au moins 6 caractères."); return; }
    if (currentPassword === newPassword) { setErrorMsg("Le nouveau mot de passe doit être différent du mot de passe actuel."); return; }
    setLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setSuccessMsg("Mot de passe modifié avec succès."); setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setErrorMsg(axiosErr.response?.data?.error || "Échec du changement de mot de passe.");
    } finally { setLoading(false); }
  };

  const inputCls = "h-11 bg-muted border-border text-foreground placeholder:text-muted-foreground/60 focus:border-secondary focus:ring-secondary/30";

  return (
    <div className="max-w-md mx-auto">
      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-gold flex items-center justify-center"><KeyRound className="h-4 w-4 text-secondary-foreground" /></div>
            <span className="text-foreground">Changer le mot de passe</span>
          </CardTitle>
          <CardDescription className="text-muted-foreground">Mettre à jour votre mot de passe</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Mot de passe actuel</Label>
              <div className="relative">
                <Input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className={`${inputCls} pr-10`} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-secondary transition-colors"
                  onClick={() => setShowCurrent(!showCurrent)}>{showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Nouveau mot de passe</Label>
              <div className="relative">
                <Input type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className={`${inputCls} pr-10`} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-secondary transition-colors"
                  onClick={() => setShowNew(!showNew)}>{showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
              <p className="text-xs text-muted-foreground">Minimum 6 caractères</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Confirmer le nouveau mot de passe</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={inputCls} />
            </div>
            {errorMsg && <p className="text-sm text-destructive bg-destructive/15 border border-destructive/30 rounded-md p-2">{errorMsg}</p>}
            {successMsg && <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-md p-2">{successMsg}</p>}
            <Button type="submit" className="w-full h-11 gradient-primary hover:opacity-90 text-white font-semibold shadow-lg glow-primary" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Modification...</> : "Changer le mot de passe"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
