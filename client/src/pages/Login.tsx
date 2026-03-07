/**
 * Login page for custom student/teacher accounts.
 * Students: username = class+number (e.g. 3A22), password = same.
 * Teacher: username = "teacher", password = "teacher".
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AlertCircle, LogIn, Sword } from "lucide-react";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { user, login, loginLoading, loginError } = useCustomAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  // If already logged in, redirect to home
  if (user) {
    navigate("/");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    try {
      await login({ username: username.trim(), password });
      navigate("/");
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : "登入失敗，請重試");
    }
  }

  const errorMsg = localError || loginError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-700 to-indigo-900 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-400 flex items-center justify-center shadow-lg">
            <Sword size={32} className="text-slate-800" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black text-white tracking-tight">百分戰局</h1>
            <p className="text-slate-300 text-sm mt-1 italic">Percent Battle: Mathematical Commander</p>
          </div>
        </div>

        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-slate-800">登入</CardTitle>
            <CardDescription className="text-slate-500 text-sm leading-relaxed">
              學生請輸入班號學號（例如 <strong>3A22</strong>），密碼與帳號相同。<br />
              老師帳號：<strong>teacher</strong>，密碼：<strong>teacher</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-slate-700 font-semibold text-sm">
                  帳號（班號學號）
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="例如：3A22"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  className="border-slate-200 focus:border-indigo-400 text-slate-800"
                  disabled={loginLoading}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-700 font-semibold text-sm">
                  密碼
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="與帳號相同"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="border-slate-200 focus:border-indigo-400 text-slate-800"
                  disabled={loginLoading}
                />
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11"
                disabled={loginLoading || !username || !password}
              >
                {loginLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    登入中...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn size={16} />
                    進入戰場
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-slate-400 text-xs mt-4">
          首次登入會自動建立帳號
        </p>
      </div>
    </div>
  );
}
