import { useEffect, useMemo, useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, MapPin, Calendar, PawPrint, Heart, Shield } from 'lucide-react';
import { UserProfile } from '../api/client';

interface InfoCompletionPageProps {
  onNavigate?: (view: string) => void;
  onSubmitPlan?: (formData: any) => void;
  profile?: UserProfile;
  initialPrompt?: string;
}

function parsePrompt(prompt: string) {
  const text = prompt.toLowerCase();
  const destinationMatch = prompt.match(/to\s+([a-zA-Z\s]+?)(?:\s+for|\s*,|$)/i);
  const daysMatch = prompt.match(/(\d+)\s*day/i);
  const budgetMatch = prompt.match(/(?:budget|around)\s*(?:of|around)?\s*(?:cny|rmb)?\s*[¥￥$]?\s*([0-9,]+)/i);
  const transport = text.includes('train') ? 'train' : text.includes('car') || text.includes('drive') ? 'car' : '';
  return {
    destination: destinationMatch?.[1]?.trim() || '',
    duration: daysMatch?.[1] || '',
    budgetHint: budgetMatch?.[1]?.replace(/,/g, '') || '',
    transport,
  };
}

function parsePromptEnglish(prompt: string) {
  const text = prompt.toLowerCase();
  const destinationMatch = prompt.match(/to\s+([a-zA-Z\s]+?)(?:\s+for|\s*,|$)/i);
  const daysMatch = prompt.match(/(\d+)\s*day/i);
  const budgetMatch = prompt.match(/(?:budget|around)\s*(?:of|around)?\s*(?:cny|rmb)?\s*[¥￥$]?\s*([0-9,]+)/i);
  const transport = text.includes('train') ? 'train' : text.includes('car') || text.includes('drive') ? 'car' : '';
  return {
    destination: destinationMatch?.[1]?.trim() || '',
    duration: daysMatch?.[1] || '',
    budgetHint: budgetMatch?.[1]?.replace(/,/g, '') || '',
    transport,
  };
}

export function InfoCompletionPage({ onNavigate, onSubmitPlan, profile, initialPrompt }: InfoCompletionPageProps) {
  const baseData = useMemo(() => ({
    destination: '',
    startDate: '2026-05-15',
    endDate: '2026-05-18',
    duration: '3',
    travelers: '1',
    petName: profile?.petName || '',
    petType: profile?.petType || 'dog',
    breed: profile?.breed || '',
    weight: profile?.weight || '',
    age: profile?.age || '',
    healthStatus: profile?.healthStatus || 'healthy',
    minBudget: profile?.minBudget || '',
    maxBudget: profile?.maxBudget || '',
    transportMode: profile?.transportPreference || 'car',
    hotelPreference: profile?.hotelPreference || '4-star',
    pace: profile?.travelPace || 'moderate',
    emergencyContact: profile?.emergencyName && profile?.emergencyPhone ? `${profile.emergencyName} (${profile.emergencyPhone})` : '',
    hospitalPreference: 'yes',
    medicalNotes: profile?.healthNotes || '',
  }), [profile]);

  const [formData, setFormData] = useState(baseData);

  useEffect(() => {
    const parsed = parsePromptEnglish(initialPrompt || '');
    const next = { ...baseData };
    if (parsed.destination) next.destination = parsed.destination;
    if (parsed.duration) next.duration = parsed.duration;
    if (parsed.transport) next.transportMode = parsed.transport;
    if (parsed.budgetHint) {
      const hint = Number(parsed.budgetHint);
      if (Number.isFinite(hint) && hint > 0) {
        next.minBudget = String(Math.max(0, hint - 1000));
        next.maxBudget = String(hint + 1000);
      }
    }
    setFormData(next);
  }, [baseData, initialPrompt]);

  const updateField = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = () => {
    onSubmitPlan?.(formData);
    onNavigate?.('loading');
  };

  return (
    <div className="min-h-screen bg-[var(--cream-white)]">
      <div className="border-b border-[var(--border)] bg-white">
        <div className="max-w-5xl mx-auto px-8 py-6">
          <button onClick={() => onNavigate?.('home')} className="mb-4 flex items-center gap-2 px-3 py-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--deep-blue)] hover:bg-[var(--soft-grey)] transition-all group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" strokeWidth={2} />
            <span className="text-sm font-medium">Back to Home</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--sage-green)] to-[var(--warm-orange)] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[var(--deep-blue)]">Complete Trip Details</h1>
              <p className="text-sm text-[var(--muted-foreground)]">Home input has been prefilled below. You can fine-tune before generation.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
        <div className="bg-white rounded-xl border border-[var(--border)] p-6">
          <div className="flex items-center gap-2 mb-5">
            <MapPin className="w-5 h-5 text-[var(--sage-green)]" strokeWidth={2} />
            <h3 className="font-semibold text-[var(--deep-blue)]">Trip Basics</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input value={formData.destination} onChange={(e) => updateField('destination', e.target.value)} placeholder="Destination" className="col-span-2 w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)]" />
            <input type="date" value={formData.startDate} onChange={(e) => updateField('startDate', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)]" />
            <input type="date" value={formData.endDate} onChange={(e) => updateField('endDate', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)]" />
            <input value={formData.duration} onChange={(e) => updateField('duration', e.target.value)} placeholder="Duration (days)" className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)]" />
            <input value={formData.travelers} onChange={(e) => updateField('travelers', e.target.value)} placeholder="Travelers" className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)]" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[var(--border)] p-6">
          <div className="flex items-center gap-2 mb-5">
            <PawPrint className="w-5 h-5 text-[var(--warm-orange)]" strokeWidth={2} />
            <h3 className="font-semibold text-[var(--deep-blue)]">Pet Profile</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input value={formData.petName} onChange={(e) => updateField('petName', e.target.value)} placeholder="Pet Name" className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)]" />
            <input value={formData.petType} onChange={(e) => updateField('petType', e.target.value)} placeholder="Pet Type" className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)]" />
            <input value={formData.breed} onChange={(e) => updateField('breed', e.target.value)} placeholder="Breed" className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)]" />
            <input value={formData.weight} onChange={(e) => updateField('weight', e.target.value)} placeholder="Weight (kg)" className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)]" />
            <input value={formData.age} onChange={(e) => updateField('age', e.target.value)} placeholder="Age" className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)]" />
            <input value={formData.healthStatus} onChange={(e) => updateField('healthStatus', e.target.value)} placeholder="Health Status" className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)]" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[var(--border)] p-6">
          <div className="flex items-center gap-2 mb-5">
            <Heart className="w-5 h-5 text-[var(--deep-blue)]" strokeWidth={2} />
            <h3 className="font-semibold text-[var(--deep-blue)]">Travel Preferences</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input value={formData.minBudget} onChange={(e) => updateField('minBudget', e.target.value)} placeholder="Min Budget (CNY)" className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)]" />
            <input value={formData.maxBudget} onChange={(e) => updateField('maxBudget', e.target.value)} placeholder="Max Budget (CNY)" className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)]" />
            <input value={formData.transportMode} onChange={(e) => updateField('transportMode', e.target.value)} placeholder="Transport" className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)]" />
            <input value={formData.hotelPreference} onChange={(e) => updateField('hotelPreference', e.target.value)} placeholder="Hotel Preference" className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)]" />
            <input value={formData.pace} onChange={(e) => updateField('pace', e.target.value)} placeholder="Travel Pace" className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)]" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[var(--border)] p-6">
          <div className="flex items-center gap-2 mb-5">
            <Shield className="w-5 h-5 text-green-600" strokeWidth={2} />
            <h3 className="font-semibold text-[var(--deep-blue)]">Safety</h3>
          </div>
          <div className="space-y-4">
            <input value={formData.emergencyContact} onChange={(e) => updateField('emergencyContact', e.target.value)} placeholder="Emergency Contact" className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)]" />
            <textarea value={formData.medicalNotes} onChange={(e) => updateField('medicalNotes', e.target.value)} placeholder="Medical Notes" rows={3} className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] resize-none" />
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={() => onNavigate?.('home')} className="px-6 py-3.5 rounded-xl border-2 border-[var(--border)] text-[var(--deep-blue)] font-medium hover:bg-[var(--soft-grey)] transition-all">
            Back
          </button>
          <button onClick={handleGenerate} className="flex-1 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[var(--sage-green)] to-[var(--warm-orange)] text-white font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group">
            <Sparkles className="w-5 h-5" strokeWidth={2.5} />
            <span>Generate Itinerary</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

