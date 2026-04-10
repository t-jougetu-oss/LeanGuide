"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type Mode = "login" | "register";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "register") {
      // 新規登録
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }
    }

    // ログイン
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(
        mode === "register"
          ? "登録は完了しましたが、ログインに失敗しました。もう一度お試しください。"
          : "メールアドレスまたはパスワードが正しくありません"
      );
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  async function handleGoogleLogin() {
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Google ログイン */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 rounded-full border border-orange-300 px-6 py-3 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Googleで{mode === "login" ? "ログイン" : "登録"}
      </button>

      {/* 区切り線 */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
        <span className="text-xs text-zinc-400">または</span>
        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
      </div>

      {/* メール+パスワード */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === "register" && (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">名前</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-lg border border-orange-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="山田太郎"
            />
          </label>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">メールアドレス</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-lg border border-orange-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="example@email.com"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">パスワード</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="rounded-lg border border-orange-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="8文字以上"
          />
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-orange-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading
            ? "処理中..."
            : mode === "login"
              ? "ログイン"
              : "新規登録"}
        </button>
      </form>

      {/* モード切替 */}
      <p className="text-center text-sm text-zinc-500">
        {mode === "login" ? (
          <>
            アカウントをお持ちでない方は{" "}
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
              }}
              className="text-blue-500 underline"
            >
              新規登録
            </button>
          </>
        ) : (
          <>
            既にアカウントをお持ちの方は{" "}
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className="text-blue-500 underline"
            >
              ログイン
            </button>
          </>
        )}
      </p>
    </div>
  );
}
