import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuthStore } from "../stores/auth";
import { authApi } from "../api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authApi.login(email, password);
      const { token, user } = res.data.data;
      setAuth(token, user);
      navigate("/");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || "Échec de la connexion. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-secondary/8 blur-3xl pointer-events-none" />
      <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-primary/5 blur-2xl pointer-events-none" />

      <Card className="w-full max-w-md relative z-10 shadow-2xl border-border/50 bg-card">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-5">
            <div className="h-18 w-18 rounded-2xl gradient-gold flex items-center justify-center shadow-xl glow-gold">
              <Camera className="h-9 w-9 text-secondary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">
            <span className="text-secondary">OSS</span>{" "}
            <span className="text-foreground">Vidéothèque</span>
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-2 text-base">
            Connectez-vous pour accéder à la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-destructive/15 border border-destructive/30 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground">Adresse e-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="Entrez votre adresse e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="h-11 bg-muted border-border text-foreground placeholder:text-muted-foreground/60 focus:border-secondary focus:ring-secondary/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-muted-foreground">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Entrez votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10 bg-muted border-border text-foreground placeholder:text-muted-foreground/60 focus:border-secondary focus:ring-secondary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 gradient-primary hover:opacity-90 text-white font-semibold shadow-lg hover:shadow-xl transition-all glow-primary"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {loading ? "Connexion en cours..." : "Se connecter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
