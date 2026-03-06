import { useState } from "react";
import {
  SignupFormData,
  PreBrideMeasurements,
  PostBrideMeasurements,
  PreBrideStyle,
  PostBrideStyle,
} from "./types";
import ProgressBar from "./ProgressBar";
import Step1Role from "./Step1Role";
import Step2BasicInfo from "./Step2BasicInfo";
import Step3Measurements from "./Step3Measurements";
import Step4Style from "./Step4Style";
import Step5Review from "./Step5Review";

const INITIAL_FORM_DATA: SignupFormData = {
  step1: { role: null },
  step2: {
    firstName: "",
    lastName: "",
    email: "",
    age: "",
    ethnicity: null,
    zipCode: "",
  },
  step3: null,
  step4: null,
};

function initStep3(role: "pre-bride" | "post-bride"): PreBrideMeasurements | PostBrideMeasurements {
  if (role === "pre-bride") {
    return { heightFeet: "", heightInches: "", bust: "", waist: "", hips: "" };
  }
  return { heightFeet: "", heightInches: "", dressBust: "", dressWaist: "", dressHips: "" };
}

function initStep4(role: "pre-bride" | "post-bride"): PreBrideStyle | PostBrideStyle {
  if (role === "pre-bride") {
    return { preferredStyles: [] };
  }
  return { dressStyle: null };
}

export default function SignupWizard() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [formData, setFormData] = useState<SignupFormData>(INITIAL_FORM_DATA);

  function handleNext() {
    if (currentStep === 2) {
      const role = formData.step1.role!;
      setFormData((prev) => ({
        ...prev,
        step3: prev.step3 ?? initStep3(role),
      }));
    }
    if (currentStep === 3) {
      const role = formData.step1.role!;
      setFormData((prev) => ({
        ...prev,
        step4: prev.step4 ?? initStep4(role),
      }));
    }
    setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3 | 4 | 5);
  }

  function handleBack() {
    setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4 | 5);
  }

  function handleEdit(step: 1 | 2 | 3 | 4) {
    setCurrentStep(step);
  }

  function handleSubmit() {
    console.log("Sign-up submitted:", formData);
    // Backend wiring goes here
  }

  const role = formData.step1.role;

  return (
    <div className="w-full max-w-lg rounded-2xl bg-white shadow-sm border border-zinc-100 px-8 py-10">
      <ProgressBar currentStep={currentStep} totalSteps={5} />

      {currentStep === 1 && (
        <Step1Role
          data={formData.step1}
          onChange={(d) => setFormData((prev) => ({ ...prev, step1: d }))}
          onNext={handleNext}
        />
      )}

      {currentStep === 2 && (
        <Step2BasicInfo
          data={formData.step2}
          onChange={(d) => setFormData((prev) => ({ ...prev, step2: d }))}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}

      {currentStep === 3 && role && formData.step3 && (
        <Step3Measurements
          role={role}
          data={formData.step3}
          onChange={(d) => setFormData((prev) => ({ ...prev, step3: d }))}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}

      {currentStep === 4 && role && formData.step4 && (
        <Step4Style
          role={role}
          data={formData.step4}
          onChange={(d) => setFormData((prev) => ({ ...prev, step4: d }))}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}

      {currentStep === 5 && (
        <Step5Review
          formData={formData}
          onEdit={handleEdit}
          onSubmit={handleSubmit}
          onBack={handleBack}
        />
      )}
    </div>
  );
}
