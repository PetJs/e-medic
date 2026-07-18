import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { z } from "zod";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import brainImg from "@/assets/brain.svg";

const SignupSchema = z.object({
  full_name: z
    .string()
    .trim()
    .refine((v) => v.split(/\s+/).length >= 2, "Enter your first and last name"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    const formData = Object.fromEntries(new FormData(e.currentTarget));
    const result = SignupSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    const [firstName, ...rest] = result.data.full_name.split(/\s+/);
    setSubmitting(true);
    try {
      await register({
        email: result.data.email,
        password: result.data.password,
        first_name: firstName,
        last_name: rest.join(" "),
      });
      navigate("/dashboard");
    } catch (err) {
      setErrors({
        form:
          err instanceof ApiError
            ? err.message
            : "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-background to-teal-50 px-4 py-10 dark:from-background dark:to-background">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border bg-card shadow-xl md:grid-cols-2">
        {/* Left panel */}
        <div className="hidden flex-col items-center justify-center gap-6 bg-primary/5 p-10 md:flex">
          <img
            src={brainImg}
            alt=""
            className="aspect-square w-56 rounded-lg object-cover"
          />
          <div className="text-center">
            <h2 className="text-lg font-bold">Master Medical Knowledge</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Join a community of students dedicated to excellence.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="p-8 md:p-10">
          <h1 className="text-2xl font-bold">Create Your Account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Start your journey to mastering medical knowledge with us.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            {errors.form && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errors.form}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="full_name"
                  name="full_name"
                  placeholder="Enter your full name"
                  className="pl-9"
                  aria-invalid={!!errors.full_name}
                />
              </div>
              {errors.full_name && (
                <p className="text-xs text-destructive">{errors.full_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  className="pl-9"
                  aria-invalid={!!errors.email}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="px-9"
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? "Creating account…" : "Create Account"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Log in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
