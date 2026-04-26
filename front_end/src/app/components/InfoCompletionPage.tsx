import { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, AlertCircle, ArrowLeft, MapPin, Calendar, Users, DollarSign, PawPrint, Heart, Shield, Phone } from 'lucide-react';

interface InfoCompletionPageProps {
  onNavigate?: (view: string) => void;
  onSubmitPlan?: (formData: any) => void;
}

export function InfoCompletionPage({ onNavigate, onSubmitPlan }: InfoCompletionPageProps) {
  const [formData, setFormData] = useState({
    // Trip basics
    destination: 'Hangzhou',
    startDate: '2026-05-15',
    endDate: '2026-05-18',
    duration: '3',
    travelers: '1',

    // Pet profile
    petName: 'Biscuit',
    petType: 'dog',
    breed: 'Golden Retriever',
    weight: '35',
    age: '3',
    healthStatus: 'good',

    // Travel preferences
    minBudget: '3500',
    maxBudget: '6000',
    transportMode: 'car',
    hotelPreference: '4-star',
    pace: 'relaxed',

    // Safety
    emergencyContact: 'Jane Chen (+86 138-0000-1234)',
    hospitalPreference: 'yes',
    medicalNotes: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const completionRate = () => {
    const requiredFields = ['destination', 'startDate', 'endDate', 'duration', 'petName', 'petType', 'breed', 'weight', 'age', 'healthStatus', 'minBudget', 'maxBudget', 'transportMode', 'hotelPreference', 'pace', 'emergencyContact'];
    const filled = requiredFields.filter(field => formData[field as keyof typeof formData] && formData[field as keyof typeof formData] !== '').length;
    return Math.round((filled / requiredFields.length) * 100);
  };

  const handleGenerate = () => {
    onSubmitPlan?.(formData);
    onNavigate?.('loading');
  };

  return (
    <div className="min-h-screen bg-[var(--cream-white)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-white">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <button
            onClick={() => onNavigate?.('home')}
            className="mb-4 flex items-center gap-2 px-3 py-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--deep-blue)] hover:bg-[var(--soft-grey)] transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" strokeWidth={2} />
            <span className="text-sm font-medium">Back to Home</span>
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--sage-green)] to-[var(--warm-orange)] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[var(--deep-blue)]">
                Complete Trip Details
              </h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                Fill in the details to generate your personalized itinerary
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[var(--deep-blue)]">
                Completion Progress
              </span>
              <span className="text-sm font-semibold text-[var(--sage-green)]">
                {completionRate()}%
              </span>
            </div>
            <div className="h-2 bg-[var(--soft-grey)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--sage-green)] to-[var(--warm-orange)] transition-all duration-500"
                style={{ width: `${completionRate()}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex gap-8">
          {/* Left: Forms */}
          <div className="flex-1 space-y-6">
            {/* Trip Basics */}
            <div className="bg-white rounded-xl border border-[var(--border)] p-6">
              <div className="flex items-center gap-2 mb-5">
                <MapPin className="w-5 h-5 text-[var(--sage-green)]" strokeWidth={2} />
                <h3 className="font-semibold text-[var(--deep-blue)]">Trip Basics</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">
                    Destination
                  </label>
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) => updateField('destination', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => updateField('startDate', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => updateField('endDate', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">
                    Duration (days)
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => updateField('duration', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">
                    Number of Travelers
                  </label>
                  <input
                    type="text"
                    value={formData.travelers}
                    onChange={(e) => updateField('travelers', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Pet Profile */}
            <div className="bg-white rounded-xl border border-[var(--border)] p-6">
              <div className="flex items-center gap-2 mb-5">
                <PawPrint className="w-5 h-5 text-[var(--warm-orange)]" strokeWidth={2} />
                <h3 className="font-semibold text-[var(--deep-blue)]">Pet Profile</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">
                    Pet Name
                  </label>
                  <input
                    type="text"
                    value={formData.petName}
                    onChange={(e) => updateField('petName', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">
                    Pet Type
                  </label>
                  <select
                    value={formData.petType}
                    onChange={(e) => updateField('petType', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                  >
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">
                    Breed
                  </label>
                  <input
                    type="text"
                    value={formData.breed}
                    onChange={(e) => updateField('breed', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => updateField('weight', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">
                    Age (years)
                  </label>
                  <input
                    type="text"
                    value={formData.age}
                    onChange={(e) => updateField('age', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">
                    Health Status
                  </label>
                  <select
                    value={formData.healthStatus}
                    onChange={(e) => updateField('healthStatus', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="needs-attention">Needs Attention</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Travel Preferences */}
            <div className="bg-white rounded-xl border border-[var(--border)] p-6">
              <div className="flex items-center gap-2 mb-5">
                <Heart className="w-5 h-5 text-[var(--deep-blue)]" strokeWidth={2} />
                <h3 className="font-semibold text-[var(--deep-blue)]">Travel Preferences</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">
                    Min Budget (CNY)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.minBudget}
                    onChange={(e) => updateField('minBudget', e.target.value)}
                    placeholder="3500"
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">
                    Max Budget (CNY)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.maxBudget}
                    onChange={(e) => updateField('maxBudget', e.target.value)}
                    placeholder="6000"
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">
                    Transport Mode
                  </label>
                  <select
                    value={formData.transportMode}
                    onChange={(e) => updateField('transportMode', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                  >
                    <option value="car">Private Car</option>
                    <option value="train">High-Speed Train</option>
                    <option value="mixed">Mixed Transport</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">
                    Hotel Preference
                  </label>
                  <select
                    value={formData.hotelPreference}
                    onChange={(e) => updateField('hotelPreference', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                  >
                    <option value="3-star">3-Star Pet-Friendly</option>
                    <option value="4-star">4-Star Pet-Friendly</option>
                    <option value="5-star">5-Star Luxury</option>
                    <option value="boutique">Boutique Pet Hotel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">
                    Travel Pace
                  </label>
                  <select
                    value={formData.pace}
                    onChange={(e) => updateField('pace', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                  >
                    <option value="relaxed">Relaxed (4-5 hrs/day)</option>
                    <option value="moderate">Moderate (6-7 hrs/day)</option>
                    <option value="active">Active (8+ hrs/day)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Safety */}
            <div className="bg-white rounded-xl border border-[var(--border)] p-6">
              <div className="flex items-center gap-2 mb-5">
                <Shield className="w-5 h-5 text-green-600" strokeWidth={2} />
                <h3 className="font-semibold text-[var(--deep-blue)]">Safety</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContact}
                    onChange={(e) => updateField('emergencyContact', e.target.value)}
                    placeholder="Name and phone number"
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">
                    Include Nearby Pet Hospitals
                  </label>
                  <select
                    value={formData.hospitalPreference}
                    onChange={(e) => updateField('hospitalPreference', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                  >
                    <option value="yes">Yes, include hospitals</option>
                    <option value="no">No, not needed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">
                    Medical Notes (optional)
                  </label>
                  <textarea
                    value={formData.medicalNotes}
                    onChange={(e) => updateField('medicalNotes', e.target.value)}
                    placeholder="Any allergies, medications, or special medical needs..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Plan Preview */}
          <div className="w-96 flex-shrink-0">
            <div className="bg-white rounded-xl border border-[var(--border)] sticky top-8 overflow-hidden">
              <div className="p-5 border-b border-[var(--border)] bg-gradient-to-br from-[var(--light-sage)] to-white">
                <h3 className="font-semibold text-[var(--deep-blue)] mb-1">
                  Plan Preview
                </h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Your trip summary
                </p>
              </div>

              <div className="p-5 space-y-4 max-h-[600px] overflow-y-auto">
                <div className="p-3 rounded-lg bg-[var(--soft-grey)]">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-[var(--sage-green)]" strokeWidth={2} />
                    <span className="text-xs font-semibold text-[var(--deep-blue)]">Destination</span>
                  </div>
                  <p className="text-sm text-[var(--deep-blue)]">{formData.destination}</p>
                </div>

                <div className="p-3 rounded-lg bg-[var(--soft-grey)]">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-[var(--sage-green)]" strokeWidth={2} />
                    <span className="text-xs font-semibold text-[var(--deep-blue)]">Dates</span>
                  </div>
                  <p className="text-sm text-[var(--deep-blue)]">
                    {formData.startDate} to {formData.endDate}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    {formData.duration} days
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[var(--soft-grey)]">
                  <div className="flex items-center gap-2 mb-2">
                    <PawPrint className="w-4 h-4 text-[var(--warm-orange)]" strokeWidth={2} />
                    <span className="text-xs font-semibold text-[var(--deep-blue)]">Pet</span>
                  </div>
                  <p className="text-sm text-[var(--deep-blue)]">
                    {formData.petName}, {formData.breed}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    {formData.age} years old, {formData.weight}kg, {formData.healthStatus} health
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[var(--soft-grey)]">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-[var(--sage-green)]" strokeWidth={2} />
                    <span className="text-xs font-semibold text-[var(--deep-blue)]">Budget Range</span>
                  </div>
                  <p className="text-sm text-[var(--deep-blue)]">
                    ¥{formData.minBudget || '0'} - ¥{formData.maxBudget || '0'}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[var(--soft-grey)]">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-[var(--sage-green)]" strokeWidth={2} />
                    <span className="text-xs font-semibold text-[var(--deep-blue)]">Preferences</span>
                  </div>
                  <p className="text-sm text-[var(--deep-blue)]">
                    {formData.transportMode === 'car' ? 'Private Car' : formData.transportMode === 'train' ? 'High-Speed Train' : 'Mixed Transport'}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    {formData.hotelPreference} · {formData.pace} pace
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[var(--soft-grey)]">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-green-600" strokeWidth={2} />
                    <span className="text-xs font-semibold text-[var(--deep-blue)]">Safety</span>
                  </div>
                  <p className="text-sm text-[var(--deep-blue)]">{formData.emergencyContact}</p>
                  {formData.hospitalPreference === 'yes' && (
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">
                      Including nearby pet hospitals
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => onNavigate?.('home')}
            className="px-6 py-3.5 rounded-xl border-2 border-[var(--border)] text-[var(--deep-blue)] font-medium hover:bg-[var(--soft-grey)] transition-all"
          >
            Back to Home
          </button>
          <button
            onClick={handleGenerate}
            className="flex-1 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[var(--sage-green)] to-[var(--warm-orange)] text-white font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
          >
            <Sparkles className="w-5 h-5" strokeWidth={2.5} />
            <span>Generate Itinerary</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
