import { useState } from "react";
import { BasicInfoData, EthnicityOption } from "./types";
import NavigationButtons from "./NavigationButtons";

interface Step2BasicInfoProps {
  data: BasicInfoData;
  onChange: (data: BasicInfoData) => void;
  onNext: () => void;
  onBack: () => void;
}

const ETHNICITY_OPTIONS: EthnicityOption[] = [
  "Asian",
  "Black or African American",
  "Hispanic or Latino",
  "Middle Eastern or North African",
  "Native American or Alaska Native",
  "Native Hawaiian or Pacific Islander",
  "White",
  "Multiracial",
  "Prefer not to say",
];

type Errors = Partial<Record<keyof BasicInfoData, string>>;

function inputClass(hasError: boolean) {
  return `w-full px-3 py-2.5 text-sm rounded-lg border transition-colors outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 ${
    hasError ? "border-red-400 bg-red-50" : "border-zinc-200 bg-white hover:border-zinc-300"
  }`;
}

export default function Step2BasicInfo({
  data,
  onChange,
  onNext,
  onBack,
}: Step2BasicInfoProps) {
  const [errors, setErrors] = useState<Errors>({});

  function update(field: keyof BasicInfoData, value: string | EthnicityOption | null) {
    onChange({ ...data, [field]: value });
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function handleNext() {
    const newErrors: Errors = {};
    if (!data.firstName.trim()) newErrors.firstName = "First name is required";
    if (!data.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      newErrors.email = "A valid email is required";
    if (!data.age.trim() || Number(data.age) < 18 || Number(data.age) > 100)
      newErrors.age = "Age must be between 18 and 100";
    if (!data.zipCode.trim() || !/^\d{5}$/.test(data.zipCode))
      newErrors.zipCode = "Enter a valid 5-digit ZIP code";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    onNext();
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-zinc-900 mb-1">Basic info</h2>
      <p className="text-sm text-zinc-500 mb-6">Tell us a little about yourself.</p>

      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-zinc-700 mb-1">First name</label>
            <input
              type="text"
              value={data.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              placeholder="Jane"
              className={inputClass(!!errors.firstName)}
            />
            {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-zinc-700 mb-1">Last name</label>
            <input
              type="text"
              value={data.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              placeholder="Doe"
              className={inputClass(!!errors.lastName)}
            />
            {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">Email</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="jane@example.com"
            className={inputClass(!!errors.email)}
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">Age</label>
          <input
            type="number"
            value={data.age}
            onChange={(e) => update("age", e.target.value)}
            placeholder="28"
            min={18}
            max={100}
            className={inputClass(!!errors.age)}
          />
          {errors.age && <p className="text-xs text-red-500 mt-1">{errors.age}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">
            Ethnicity <span className="text-zinc-400 font-normal">(optional)</span>
          </label>
          <select
            value={data.ethnicity ?? ""}
            onChange={(e) =>
              update("ethnicity", e.target.value ? (e.target.value as EthnicityOption) : null)
            }
            className={`${inputClass(false)} text-zinc-700`}
          >
            <option value="">Select...</option>
            {ETHNICITY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <p className="text-xs text-zinc-400 mt-1">
            Optional — used for analytics only. &quot;Prefer not to say&quot; is always available.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">ZIP code</label>
          <input
            type="text"
            value={data.zipCode}
            onChange={(e) => update("zipCode", e.target.value)}
            placeholder="90210"
            maxLength={5}
            className={inputClass(!!errors.zipCode)}
          />
          {errors.zipCode && <p className="text-xs text-red-500 mt-1">{errors.zipCode}</p>}
        </div>
      </div>

      <NavigationButtons onBack={onBack} onNext={handleNext} />
    </div>
  );
}
