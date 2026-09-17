import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  // Priority-B dedup detection: if the create response flags similar
  // existing challenges, we hold here and show a soft warning instead
  // of auto-navigating — the challenge is already submitted either
  // way, this is purely informational (see lib/dedup.ts).
  const [possibleDuplicates, setPossibleDuplicates] = useState<{ id: string; title: string }[]>([]);

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
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["myChallenges"] });
      if (created.possibleDuplicates.length > 0) {
        // Submitted either way — just don't whisk them away before
        // they've seen the heads-up.
        setPossibleDuplicates(created.possibleDuplicates);
      } else {
        navigate("/dashboard");
      }
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

  // Priority-B: the challenge is already submitted by this point either
  // way — this replaces the form with a soft, dismissible heads-up
  // rather than blocking or reversing anything.
  if (possibleDuplicates.length > 0) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h1 className="text-lg font-semibold text-slate-900 mb-3">Challenge submitted</h1>
            <p role="status" className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
              Heads up — this looks similar to something already reported in your district:
            </p>
            <ul className="text-sm text-slate-700 space-y-1 mb-4 list-disc list-inside">
              {possibleDuplicates.map((d) => (
                <li key={d.id}>{d.title}</li>
              ))}
            </ul>
            <p className="text-sm text-slate-500 mb-5">
              Your submission went through regardless — this is just in case it's already being worked on.
            </p>
            <Link
              to="/dashboard"
              className="inline-block rounded-lg bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400"
            >
              Go to my dashboard
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

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
