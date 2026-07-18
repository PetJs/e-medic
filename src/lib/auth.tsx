import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, clearTokens, getAccessToken, setTokens } from "@/lib/api";
import type { AuthResponse, User } from "@/types/api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getAccessToken()) {
      setLoading(false);
      return;
    }
    api<User>("/users/me")
      .then(setUser)
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await api<AuthResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    setTokens(res.access_token, res.refresh_token);
    setUser(res.user);
    return res.user;
  }

  async function register(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) {
    const res = await api<AuthResponse>("/auth/register", {
      method: "POST",
      // The register endpoint expects camelCase name fields
      body: {
        email: data.email,
        password: data.password,
        firstName: data.first_name,
        lastName: data.last_name,
      },
      auth: false,
    });
    setTokens(res.access_token, res.refresh_token);
    setUser(res.user);
    return res.user;
  }

  function logout() {
    api("/auth/logout", { method: "POST" }).catch(() => {});
    clearTokens();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
