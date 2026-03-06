import Link from "next/link";

// Placeholder user data — will come from session/auth once backend is wired up
const MOCK_USER = {
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  age: "28",
  zipCode: "90210",
  ethnicity: "Prefer not to say",
  role: "pre-bride" as const,
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-3.5 flex items-center justify-between border-b border-zinc-100 last:border-none">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm text-zinc-900 font-medium">{value}</span>
    </div>
  );
}

export default function SettingsPage() {
  const deleteHref = `/dashboard/delete-account?role=${MOCK_USER.role}`;

  return (
    <main className="min-h-screen bg-zinc-50 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-lg flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Settings</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your account information.</p>
        </div>

        {/* Account info */}
        <div className="rounded-2xl bg-white border border-zinc-100 shadow-sm px-6 py-2">
          <Field label="First name" value={MOCK_USER.firstName} />
          <Field label="Last name" value={MOCK_USER.lastName} />
          <Field label="Email" value={MOCK_USER.email} />
          <Field label="Age" value={MOCK_USER.age} />
          <Field label="ZIP code" value={MOCK_USER.zipCode} />
          <Field label="Ethnicity" value={MOCK_USER.ethnicity} />
          <Field
            label="Role"
            value={MOCK_USER.role === "pre-bride" ? "Pre-bride" : "Post-bride"}
          />
        </div>

        {/* Danger zone */}
        <div className="rounded-2xl bg-white border border-zinc-200 shadow-sm px-6 py-5">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">
            Account
          </p>
          <p className="text-sm text-zinc-500 mb-4">
            Ready to move on? Deleting your account will remove all your data
            permanently.
          </p>
          <Link
            href={deleteHref}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-red-500 border border-red-200 rounded-full hover:bg-red-50 hover:border-red-300 transition-colors"
          >
            Just got married! &#127941;
          </Link>
        </div>
      </div>
    </main>
  );
}
