import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createChallenge, ApiError } from "../lib/api";
import type { Category } from "../lib/api";
import { CATEGORY_OPTIONS } from "../lib/challengeLabels";
import AppLayout from "../components/AppLayout";

interface SubmitFormValues {
  title: string;
  description: string;
  category: Category | "";
  district: string;
}

export default function SubmitChallengePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SubmitFormValues>({
    defaultValues: { title: "", description: "", category: "", district: "" },
  });

  // Session 3 scope: created with status SUBMITTED, no partner assigned yet
  // (auto-routing is Session 4's job, per PROJECT_REFERENCE.md §5/§8 —
  // deliberately not built here, confirmed before starting this session).
  const mutation = useMutation({
    mutationFn: (values: SubmitFormValues) =>
      createChallenge({ ...values, category: values.category as Category }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myChallenges"] });
      navigate("/dashboard");
    },
    onError: (err) => {
      setServerError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    },
  });

  const onSubmit = (values: SubmitFormValues) => {
    if (!values.category) {
      setServerError("Choose a category.");
      return;
    }
    setServerError(null);
    mutation.mutate(values);
  };

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto">
        <h1 className="text-xl font-semibold text-slate-900 mb-1">Submit a challenge</h1>
        <p className="text-sm text-slate-500 mb-6">
          Describe the problem you're facing — it'll be reviewed and routed to a partner who can help.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 bg-white rounded-xl border border-slate-200 p-6"
          noValidate
        >
          <div>
            <label htmlFor="submit-title" className="block text-sm font-medium text-slate-700 mb-1">
              Title
            </label>
            <input
              id="submit-title"
              type="text"
              {...register("title", { required: "Title is required.", maxLength: { value: 200, message: "Title is too long." } })}
              aria-invalid={errors.title ? "true" : "false"}
              aria-describedby={errors.title ? "submit-title-error" : undefined}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="Short summary of the problem"
            />
            {errors.title && (
              <p id="submit-title-error" className="text-xs text-red-600 mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="submit-description" className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              id="submit-description"
              {...register("description", { required: "Description is required." })}
              rows={5}
              aria-invalid={errors.description ? "true" : "false"}
              aria-describedby={errors.description ? "submit-description-error" : undefined}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="What's going on, and what would help?"
            />
            {errors.description && (
              <p id="submit-description-error" className="text-xs text-red-600 mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="submit-category" className="block text-sm font-medium text-slate-700 mb-1">
              Category
            </label>
            <select
              id="submit-category"
              {...register("category", { required: "Choose a category." })}
              aria-invalid={errors.category ? "true" : "false"}
              aria-describedby={errors.category ? "submit-category-error" : undefined}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
            >
              <option value="">Select a category</option>
              {CATEGORY_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p id="submit-category-error" className="text-xs text-red-600 mt-1">
                {errors.category.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="submit-district" className="block text-sm font-medium text-slate-700 mb-1">
              District
            </label>
            <input
              id="submit-district"
              type="text"
              {...register("district", { required: "District is required." })}
              aria-invalid={errors.district ? "true" : "false"}
              aria-describedby={errors.district ? "submit-district-error" : undefined}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            {errors.district && (
              <p id="submit-district-error" className="text-xs text-red-600 mt-1">
                {errors.district.message}
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
            disabled={mutation.isPending}
            className="w-full rounded-lg bg-slate-900 text-white text-sm font-medium py-2.5 hover:bg-slate-800 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400"
          >
            {mutation.isPending ? "Submitting..." : "Submit challenge"}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
