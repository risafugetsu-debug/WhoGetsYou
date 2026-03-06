import { useState } from "react";
import {
  UserRole,
  PreBrideMeasurements,
  PostBrideMeasurements,
  isPreBrideMeasurements,
} from "./types";
import NavigationButtons from "./NavigationButtons";

interface Step3MeasurementsProps {
  role: UserRole;
  data: PreBrideMeasurements | PostBrideMeasurements;
  onChange: (data: PreBrideMeasurements | PostBrideMeasurements) => void;
  onNext: () => void;
  onBack: () => void;
}

type Errors = Partial<
  Record<
    keyof PreBrideMeasurements | keyof PostBrideMeasurements,
    string
  >
>;

function inputClass(hasError: boolean) {
  return `w-full px-3 py-2.5 text-sm rounded-lg border transition-colors outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 ${
    hasError ? "border-red-400 bg-red-50" : "border-zinc-200 bg-white hover:border-zinc-300"
  }`;
}

function MeasurementField({
  label,
  value,
  onChange,
  error,
  unit = "in",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  unit?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-700 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={1}
          step={0.5}
          placeholder="0"
          className={inputClass(!!error)}
        />
        <span className="text-sm text-zinc-500 shrink-0">{unit}</span>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default function Step3Measurements({
  role,
  data,
  onChange,
  onNext,
  onBack,
}: Step3MeasurementsProps) {
  const [errors, setErrors] = useState<Errors>({});

  const isPreBride = isPreBrideMeasurements(data);
  const preBrideData = isPreBride ? (data as PreBrideMeasurements) : null;
  const postBrideData = !isPreBride ? (data as PostBrideMeasurements) : null;

  function updateField(field: string, value: string) {
    onChange({ ...data, [field]: value } as PreBrideMeasurements | PostBrideMeasurements);
    if (errors[field as keyof Errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function isPositive(val: string) {
    return val.trim() !== "" && Number(val) > 0;
  }

  function handleNext() {
    const newErrors: Errors = {};

    if (!data.heightFeet.trim() || Number(data.heightFeet) < 3 || Number(data.heightFeet) > 8)
      newErrors.heightFeet = "Enter feet between 3–8";
    if (data.heightInches.trim() === "" || Number(data.heightInches) < 0 || Number(data.heightInches) > 11)
      newErrors.heightInches = "Enter inches between 0–11";

    if (role === "pre-bride" && preBrideData) {
      if (!isPositive(preBrideData.bust)) newErrors.bust = "Required";
      if (!isPositive(preBrideData.waist)) newErrors.waist = "Required";
      if (!isPositive(preBrideData.hips)) newErrors.hips = "Required";
    }

    if (role === "post-bride" && postBrideData) {
      if (!isPositive(postBrideData.dressBust)) newErrors.dressBust = "Required";
      if (!isPositive(postBrideData.dressWaist)) newErrors.dressWaist = "Required";
      if (!isPositive(postBrideData.dressHips)) newErrors.dressHips = "Required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    onNext();
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-zinc-900 mb-1">Measurements</h2>
      <p className="text-sm text-zinc-500 mb-6">All measurements in inches unless noted.</p>

      <div className="flex flex-col gap-5">
        {/* Height — same for both roles */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">Your height</label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="number"
                value={data.heightFeet}
                onChange={(e) => updateField("heightFeet", e.target.value)}
                min={3}
                max={8}
                placeholder="5"
                className={inputClass(!!errors.heightFeet)}
              />
              {errors.heightFeet && (
                <p className="text-xs text-red-500 mt-1">{errors.heightFeet}</p>
              )}
            </div>
            <span className="text-sm text-zinc-500 shrink-0">ft</span>
            <div className="flex-1">
              <input
                type="number"
                value={data.heightInches}
                onChange={(e) => updateField("heightInches", e.target.value)}
                min={0}
                max={11}
                placeholder="7"
                className={inputClass(!!errors.heightInches)}
              />
              {errors.heightInches && (
                <p className="text-xs text-red-500 mt-1">{errors.heightInches}</p>
              )}
            </div>
            <span className="text-sm text-zinc-500 shrink-0">in</span>
          </div>
        </div>

        {/* Pre-bride: body measurements */}
        {role === "pre-bride" && preBrideData && (
          <>
            <div className="pt-1 border-t border-zinc-100">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                Your body measurements
              </p>
              <div className="flex flex-col gap-4">
                <MeasurementField
                  label="Bust"
                  value={preBrideData.bust}
                  onChange={(v) => updateField("bust", v)}
                  error={errors.bust}
                />
                <MeasurementField
                  label="Waist"
                  value={preBrideData.waist}
                  onChange={(v) => updateField("waist", v)}
                  error={errors.waist}
                />
                <MeasurementField
                  label="Hips"
                  value={preBrideData.hips}
                  onChange={(v) => updateField("hips", v)}
                  error={errors.hips}
                />
              </div>
            </div>
          </>
        )}

        {/* Post-bride: dress measurements */}
        {role === "post-bride" && postBrideData && (
          <div className="pt-1 border-t border-zinc-100">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">
              What does your dress measure?
            </p>
            <p className="text-xs text-zinc-400 mb-3">
              Measure the actual dress fabric, not your body.
            </p>
            <div className="flex flex-col gap-4">
              <MeasurementField
                label="Dress bust"
                value={postBrideData.dressBust}
                onChange={(v) => updateField("dressBust", v)}
                error={errors.dressBust}
              />
              <MeasurementField
                label="Dress waist"
                value={postBrideData.dressWaist}
                onChange={(v) => updateField("dressWaist", v)}
                error={errors.dressWaist}
              />
              <MeasurementField
                label="Dress hips"
                value={postBrideData.dressHips}
                onChange={(v) => updateField("dressHips", v)}
                error={errors.dressHips}
              />
            </div>
          </div>
        )}
      </div>

      <NavigationButtons onBack={onBack} onNext={handleNext} />
    </div>
  );
}
