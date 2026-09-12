import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../lib/auth";
import { ApiError } from "../lib/api";
import type { User } from "../lib/api";

function dashboardPathFor(user: User): string {
  return user.role === "PARTNER" ? "/partner" : "/dashboard";
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone or email</label>
            <input
              type="text"
              {...register("identifier", { required: "Enter your phone number or email." })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="9990000001 or you@example.com"
            />
            {errors.identifier && <p className="text-xs text-red-600 mt-1">{errors.identifier.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              {...register("password", { required: "Enter your password." })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
          </div>

          {serverError && <p className="text-sm text-red-600">{serverError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-slate-900 text-white text-sm font-medium py-2.5 hover:bg-slate-800 disabled:opacity-50"
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
