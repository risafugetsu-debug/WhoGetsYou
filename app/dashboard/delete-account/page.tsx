"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { UserRole } from "@/components/signup/types";

const FAREWELL: Record<UserRole, { heading: string; message: string }> = {
  "pre-bride": {
    heading: "Until next time.",
    message:
      "Thank you for choosing to give another life to a pre-loved wedding dress.",
  },
  "post-bride": {
    heading: "It meant the world.",
    message:
      "Thank you for sharing your wedding day happiness with other brides.",
  },
};

function DeleteAccountContent() {
  const searchParams = useSearchParams();
  const rawRole = searchParams.get("role");
  const role: UserRole | null =
    rawRole === "pre-bride" || rawRole === "post-bride" ? rawRole : null;

  const [deleted, setDeleted] = useState(false);

  if (deleted) {
    const farewell = role ? FAREWELL[role] : null;

    return (
      <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-3xl mb-6">&#10024;</div>
          <h1 className="text-2xl font-semibold text-zinc-900 mb-3">
            {farewell?.heading ?? "Goodbye for now."}
          </h1>
          <p className="text-zinc-500 text-base leading-relaxed mb-10">
            {farewell?.message ??
              "Your account has been deleted. We hope to see you again someday."}
          </p>
          <Link
            href="/"
            className="text-sm text-zinc-400 underline underline-offset-2 hover:text-zinc-700 transition-colors"
          >
            Return to home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white border border-zinc-100 shadow-sm px-8 py-10">
        <h1 className="text-xl font-semibold text-zinc-900 mb-2">
          Delete your account
        </h1>
        <p className="text-sm text-zinc-500 mb-8 leading-relaxed">
          This will permanently delete your account and all your data. This
          action cannot be undone.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => setDeleted(true)}
            className="w-full py-2.5 text-sm font-semibold text-white bg-red-500 rounded-full hover:bg-red-600 transition-colors"
          >
            Yes, delete my account
          </button>
          <Link
            href="/"
            className="w-full py-2.5 text-sm font-medium text-zinc-600 text-center rounded-full border border-zinc-200 hover:border-zinc-400 hover:text-zinc-900 transition-colors"
          >
            Keep my account
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function DeleteAccountPage() {
  return (
    <Suspense>
      <DeleteAccountContent />
    </Suspense>
  );
}
