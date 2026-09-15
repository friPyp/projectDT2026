import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../lib/auth";
import { ApiError } from "../lib/api";
import type { User } from "../lib/api";

// Mirrors HomeRedirect's role logic in App.tsx — kept in sync manually
// since this is a separate post-login redirect, not the same component.
function dashboardPathFor(user: User): string {
  if (user.role === "PARTNER") return "/partner";
  if (user.role === "ADMIN") return "/admin";
  return "/dashboard";
}

interface LoginFormValues {
  identifier: string; // phone or email — §8 accepts either
  password: string;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>();

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    setSubmitting(true);
    try {
      // §8: POST /auth/login body accepts phone OR email — detect which
      // one the user typed rather than making them pick.
      const isEmail = values.identifier.includes("@");
      const loggedInUser = await login({
        password: values.password,
        ...(isEmail ? { email: values.identifier } : { phone: values.identifier }),
      });
      navigate(dashboardPathFor(loggedInUser));
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-xl font-semibold text-slate-900 mb-1">Log in</h1>
        <p className="text-sm text-slate-500 mb-6">Citizens, partners, and admins all log in here.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="login-identifier" className="block text-sm font-medium text-slate-700 mb-1">
              Phone or email
            </label>
            <input
              id="login-identifier"
              type="text"
              {...register("identifier", { required: "Enter your phone number or email." })}
              aria-invalid={errors.identifier ? "true" : "false"}
              aria-describedby={errors.identifier ? "login-identifier-error" : undefined}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="9990000001 or you@example.com"
            />
            {errors.identifier && (
              <p id="login-identifier-error" className="text-xs text-red-600 mt-1">
                {errors.identifier.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              {...register("password", { required: "Enter your password." })}
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "login-password-error" : undefined}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            {errors.password && (
              <p id="login-password-error" className="text-xs text-red-600 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {serverError && (
            <p role="alert" className="text-sm text-red-600">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-slate-900 text-white text-sm font-medium py-2.5 hover:bg-slate-800 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400"
          >
            {submitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-6 text-center">
          New citizen?{" "}
          <Link to="/register" className="text-slate-900 font-medium hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
