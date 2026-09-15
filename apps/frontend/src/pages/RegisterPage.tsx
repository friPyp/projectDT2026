import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../lib/auth";
import { ApiError } from "../lib/api";

interface RegisterFormValues {
  name: string;
  phone: string;
  password: string;
  district: string;
}

export default function RegisterPage() {
  const { register: registerCitizen } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>();

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    setSubmitting(true);
    try {
      await registerCitizen(values);
      navigate("/dashboard");
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-xl font-semibold text-slate-900 mb-1">Create a citizen account</h1>
        <p className="text-sm text-slate-500 mb-6">
          Partner and admin accounts are set up separately, not through this form.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="register-name" className="block text-sm font-medium text-slate-700 mb-1">
              Name
            </label>
            <input
              id="register-name"
              type="text"
              {...register("name", { required: "Name is required." })}
              aria-invalid={errors.name ? "true" : "false"}
              aria-describedby={errors.name ? "register-name-error" : undefined}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            {errors.name && (
              <p id="register-name-error" className="text-xs text-red-600 mt-1">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="register-phone" className="block text-sm font-medium text-slate-700 mb-1">
              Phone number
            </label>
            <input
              id="register-phone"
              type="text"
              {...register("phone", { required: "Phone number is required." })}
              aria-invalid={errors.phone ? "true" : "false"}
              aria-describedby={errors.phone ? "register-phone-error" : undefined}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="9998887777"
            />
            {errors.phone && (
              <p id="register-phone-error" className="text-xs text-red-600 mt-1">
                {errors.phone.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="register-district" className="block text-sm font-medium text-slate-700 mb-1">
              District
            </label>
            <input
              id="register-district"
              type="text"
              {...register("district", { required: "District is required." })}
              aria-invalid={errors.district ? "true" : "false"}
              aria-describedby={errors.district ? "register-district-error" : undefined}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            {errors.district && (
              <p id="register-district-error" className="text-xs text-red-600 mt-1">
                {errors.district.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="register-password" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              id="register-password"
              type="password"
              {...register("password", {
                required: "Password is required.",
                minLength: { value: 6, message: "Password must be at least 6 characters." },
              })}
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "register-password-error" : undefined}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            {errors.password && (
              <p id="register-password-error" className="text-xs text-red-600 mt-1">
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
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-6 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-slate-900 font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
