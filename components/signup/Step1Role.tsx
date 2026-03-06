import { RoleData, UserRole } from "./types";
import NavigationButtons from "./NavigationButtons";

interface Step1RoleProps {
  data: RoleData;
  onChange: (data: RoleData) => void;
  onNext: () => void;
}

const roles: { value: UserRole; title: string; tagline: string }[] = [
  {
    value: "pre-bride",
    title: "I'm looking for a dress",
    tagline: "Browse dresses from real brides and find your perfect match",
  },
  {
    value: "post-bride",
    title: "I have a dress to share",
    tagline: "Help another bride find their perfect dress",
  },
];

export default function Step1Role({ data, onChange, onNext }: Step1RoleProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-zinc-900 mb-1">Who are you?</h2>
      <p className="text-sm text-zinc-500 mb-6">Choose the role that best describes you.</p>

      <div className="flex flex-col gap-3">
        {roles.map((role) => {
          const selected = data.role === role.value;
          return (
            <button
              key={role.value}
              onClick={() => onChange({ role: role.value })}
              className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all ${
                selected
                  ? "border-zinc-900 bg-zinc-50"
                  : "border-zinc-200 bg-white hover:border-zinc-400"
              }`}
            >
              <p className="font-semibold text-zinc-900 text-sm">{role.title}</p>
              <p className="text-zinc-500 text-sm mt-0.5">{role.tagline}</p>
            </button>
          );
        })}
      </div>

      <NavigationButtons
        onNext={onNext}
        nextDisabled={data.role === null}
      />
    </div>
  );
}
