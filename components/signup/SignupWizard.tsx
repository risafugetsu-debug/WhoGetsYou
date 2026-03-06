'use client';

import { useState } from 'react';
import Link from 'next/link';
import StepIndicator from './StepIndicator';
import NavigationButtons from './NavigationButtons';
import Step1Role from './Step1Role';
import Step2BasicInfo from './Step2BasicInfo';
import Step3Measurements from './Step3Measurements';
import Step4Style from './Step4Style';
import StepWeddingDetails from './StepWeddingDetails';
import StepListingLocation from './StepListingLocation';
import type {
  SignupFormData,
  PreBrideMeasurements,
  PostBrideMeasurements,
  PreBrideStyle,
  PostBrideStyle,
  PreBrideWeddingDetails,
  PostBrideWeddingDetails,
  ListingLocationData,
} from './types';
import {
  isPreBrideMeasurements,
  isPreBrideWeddingDetails,
  isPostBrideWeddingDetails,
} from './types';
import { signupWizard } from '@/lib/signup-wizard';

// Post-bride: 6 steps — Role, About you, Measurements, Style, Wedding Details, Location & Availability
// Pre-bride:  5 steps — Role, About you, Measurements, Wedding Details, Style
const POST_BRIDE_LABELS = ['Your role', 'About you', 'Measurements', 'Your style', 'Wedding details', 'Location & availability'];
const PRE_BRIDE_LABELS  = ['Your role', 'About you', 'Measurements', 'Wedding details', 'Your style'];

const INITIAL_FORM: SignupFormData = {
  step1: { role: null },
  step2: {
    firstName: '',
    email: '',
    password: '',
    confirmPassword: '',
    ethnicity: null,
  },
  step3: null,
  step4: null,
  step5: null,
  step6: null,
};

export default function SignupWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<SignupFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const role = formData.step1.role;
  const isPreBride = role === 'pre-bride';
  const stepLabels = isPreBride ? PRE_BRIDE_LABELS : POST_BRIDE_LABELS;
  const totalSteps = stepLabels.length;

  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.step1.role) errs.role = 'Please select a role';
    }

    if (currentStep === 2) {
      const { firstName, email, password, confirmPassword } = formData.step2;
      if (!firstName.trim()) errs.firstName = 'Required';
      if (!email.trim() || !email.includes('@') || !email.slice(email.indexOf('@')).includes('.'))
        errs.email = 'Valid email required';
      if (!password || password.length < 8) errs.password = 'Min 8 characters';
      if (confirmPassword !== password) errs.confirmPassword = 'Passwords do not match';
    }

    if (currentStep === 3 && formData.step3 !== null) {
      const m = formData.step3;
      if (isPreBrideMeasurements(m)) {
        if (m.unitSystem === 'cm') {
          if (!m.heightCm || parseFloat(m.heightCm) < 100) errs.height = 'Enter a valid height in cm';
        } else {
          const ft = parseInt(m.heightFeet, 10);
          const inches = parseInt(m.heightInches, 10);
          if (!m.heightFeet || !m.heightInches || isNaN(ft) || ft < 3 || ft > 8 || isNaN(inches) || inches < 0 || inches > 11)
            errs.height = 'Enter a valid height (3–8 ft, 0–11 in)';
        }
        if (!m.bust || parseFloat(m.bust) <= 0) errs.bust = 'Required';
        if (!m.waist || parseFloat(m.waist) <= 0) errs.waist = 'Required';
        if (!m.hips || parseFloat(m.hips) <= 0) errs.hips = 'Required';
      } else {
        const ft = parseInt(m.heightFeet, 10);
        const inches = parseInt(m.heightInches, 10);
        if (!m.heightFeet || !m.heightInches || isNaN(ft) || ft < 3 || ft > 8 || isNaN(inches) || inches < 0 || inches > 11)
          errs.height = 'Enter a valid height (3–8 ft, 0–11 in)';
        if (!m.dressBust || parseFloat(m.dressBust) <= 0) errs.dressBust = 'Required';
        if (!m.dressWaist || parseFloat(m.dressWaist) <= 0) errs.dressWaist = 'Required';
        if (!m.dressHips || parseFloat(m.dressHips) <= 0) errs.dressHips = 'Required';
      }
    }

    // Step 4: post-bride = Style, pre-bride = Wedding Details
    if (currentStep === 4 && formData.step4 !== null) {
      if (isPreBride) {
        // pre-bride wedding details
        const d = formData.step4 as PreBrideWeddingDetails;
        if (!d.venueUndecided && !d.venue) errs.venue = 'Select a venue or mark as undecided';
        if (!d.dateUndecided && (!d.weddingMonth || !d.weddingYear)) {
          errs.weddingDate = 'Select a month and year or mark as undecided';
        }
      } else {
        // post-bride style
        const s = formData.step4 as PostBrideStyle;
        if (!s.neckline) errs.neckline = 'Please select a neckline';
        if (!s.silhouette) errs.silhouette = 'Please select a silhouette';
      }
    }

    // Step 5: pre-bride = Style, post-bride = Wedding Details
    if (currentStep === 5 && formData.step5 !== null) {
      if (isPreBride) {
        // pre-bride style — all optional, no required validation
      } else {
        // post-bride wedding details
        const d = formData.step5 as PostBrideWeddingDetails;
        if (!d.venue) errs.venue = 'Please select a venue type';
        if (!d.weddingMonth || !d.weddingYear) errs.weddingDate = 'Select a month and year';
      }
    }

    // Step 6: post-bride location (only for post-bride)
    if (currentStep === 6 && formData.step6 !== null) {
      const l = formData.step6;
      if (!l.city.trim()) errs.city = 'City is required';
      if (!l.availableFrom) errs.availableFrom = 'Start date required';
      if (!l.availableUntil) errs.availableUntil = 'End date required';
      if (l.availableFrom && l.availableUntil && l.availableUntil <= l.availableFrom)
        errs.availableUntil = 'End date must be after start date';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function advance() {
    if (!validate()) return;
    setErrors({});

    const r = formData.step1.role!;
    let next = formData;

    // Initialize step3 (measurements) when leaving step 2
    if (currentStep === 2 && formData.step3 === null) {
      const emptyStep3: PreBrideMeasurements | PostBrideMeasurements =
        r === 'pre-bride'
          ? { unitSystem: 'in', heightCm: '', heightFeet: '', heightInches: '', bust: '', underBust: '', waist: '', highHip: '', hips: '', neckToWaist: '', shoulderWidth: '', armLength: '' }
          : { unitSystem: 'in', heightFeet: '', heightInches: '', dressBust: '', dressUnderBust: '', dressWaist: '', dressHighHip: '', dressHips: '', dressNeckToWaist: '', dressShoulderWidth: '', dressArmLength: '' };
      next = { ...next, step3: emptyStep3 };
    }

    // Initialize step4 when leaving step 3
    if (currentStep === 3 && formData.step4 === null) {
      const emptyStep4: PostBrideStyle | PreBrideWeddingDetails =
        r === 'pre-bride'
          ? { venue: null, venueUndecided: false, weddingMonth: '', weddingYear: '', dateUndecided: false }
          : { neckline: null, silhouette: null, materials: [] };
      next = { ...next, step4: emptyStep4 };
    }

    // Initialize step5 when leaving step 4
    if (currentStep === 4 && formData.step5 === null) {
      const emptyStep5: PreBrideStyle | PostBrideWeddingDetails =
        r === 'pre-bride'
          ? { necklines: [], silhouettes: [], materials: [] }
          : { venue: null, weddingMonth: '', weddingYear: '' };
      next = { ...next, step5: emptyStep5 };
    }

    // Initialize step6 when leaving step 5 (post-bride only)
    if (currentStep === 5 && r === 'post-bride' && formData.step6 === null) {
      const emptyStep6: ListingLocationData = { city: 'New York', borough: null, availableFrom: '', availableUntil: '' };
      next = { ...next, step6: emptyStep6 };
    }

    setFormData(next);
    setCurrentStep((s) => s + 1);
  }

  function goBack() {
    setErrors({});
    setSubmitError(null);
    setCurrentStep((s) => s - 1);
  }

  async function handleSubmit() {
    if (!validate()) return;
    setIsSubmitting(true);
    setSubmitError(null);
    const { error } = await signupWizard(formData, formData.step2.password);
    setIsSubmitting(false);
    if (error) {
      setSubmitError(error);
    } else {
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div className="py-6 text-center space-y-4">
        <p className="text-4xl">🌸</p>
        <h2 className="text-2xl font-light text-[var(--color-charcoal)]">You&apos;re all set</h2>
        <p className="text-sm text-[var(--color-muted)]">
          {isPreBride
            ? 'Your profile is live — sign in to start browsing matched gowns.'
            : 'Your listing is live — sign in to see who expresses interest.'}
        </p>
        <Link
          href="/sign-in?new=1"
          className="mt-4 inline-block rounded-full bg-[var(--color-rose)] px-8 py-3 text-sm text-white transition-colors hover:bg-[var(--color-rose-dark)]"
        >
          Sign in →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <StepIndicator
        currentStep={currentStep}
        totalSteps={totalSteps}
        stepLabels={stepLabels}
      />

      <div className="mt-8">
        {currentStep === 1 && (
          <Step1Role
            data={formData.step1}
            onChange={(d) => setFormData((prev) => ({ ...prev, step1: d }))}
          />
        )}

        {currentStep === 2 && (
          <Step2BasicInfo
            data={formData.step2}
            onChange={(d) => setFormData((prev) => ({ ...prev, step2: d }))}
            errors={errors}
          />
        )}

        {currentStep === 3 && formData.step3 !== null && (
          <Step3Measurements
            role={role!}
            data={formData.step3}
            onChange={(d) => setFormData((prev) => ({ ...prev, step3: d }))}
            errors={errors}
          />
        )}

        {/* Step 4: post-bride = Style, pre-bride = Wedding Details */}
        {currentStep === 4 && formData.step4 !== null && (
          isPreBride ? (
            <StepWeddingDetails
              role="pre-bride"
              data={formData.step4 as PreBrideWeddingDetails}
              onChange={(d) => setFormData((prev) => ({ ...prev, step4: d as PreBrideWeddingDetails | PostBrideStyle }))}
              errors={errors}
            />
          ) : (
            <Step4Style
              role="post-bride"
              data={formData.step4 as PostBrideStyle}
              onChange={(d) => setFormData((prev) => ({ ...prev, step4: d as PreBrideWeddingDetails | PostBrideStyle }))}
              errors={errors}
            />
          )
        )}

        {/* Step 5: pre-bride = Style, post-bride = Wedding Details */}
        {currentStep === 5 && formData.step5 !== null && (
          isPreBride ? (
            <Step4Style
              role="pre-bride"
              data={formData.step5 as PreBrideStyle}
              onChange={(d) => setFormData((prev) => ({ ...prev, step5: d as PreBrideStyle | PostBrideWeddingDetails }))}
              errors={errors}
            />
          ) : (
            <StepWeddingDetails
              role="post-bride"
              data={formData.step5 as PostBrideWeddingDetails}
              onChange={(d) => setFormData((prev) => ({ ...prev, step5: d }))}
              errors={errors}
            />
          )
        )}

        {/* Step 6: post-bride only — Location & Availability */}
        {currentStep === 6 && formData.step6 !== null && (
          <StepListingLocation
            data={formData.step6}
            onChange={(d) => setFormData((prev) => ({ ...prev, step6: d }))}
            errors={errors}
          />
        )}
      </div>

      <NavigationButtons
        step={currentStep}
        totalSteps={totalSteps}
        onBack={goBack}
        onNext={advance}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      {submitError && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {submitError}
        </div>
      )}
    </div>
  );
}
