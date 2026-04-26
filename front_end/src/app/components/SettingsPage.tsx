import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, User, PawPrint, Heart, Shield, Phone, Save, LogOut, Edit2 } from 'lucide-react';
import { UserProfile } from '../api/client';

interface SettingsPageProps {
  onNavigate?: (view: string) => void;
  profile?: UserProfile;
  onSaveProfile?: (profile: UserProfile) => Promise<void>;
}

export function SettingsPage({ onNavigate, profile, onSaveProfile }: SettingsPageProps) {
  const baseFormData = useMemo(() => ({
    // User Profile
    fullName: profile?.fullName || 'Alex Chen',
    email: profile?.email || 'alex.chen@example.com',
    phone: profile?.phone || '+86 138-0000-1234',

    // Pet Profile
    petName: profile?.petName || 'Biscuit',
    petType: profile?.petType || 'dog',
    breed: profile?.breed || 'Golden Retriever',
    age: profile?.age || '3',
    weight: profile?.weight || '35',
    healthStatus: profile?.healthStatus || 'healthy',
    healthNotes: profile?.healthNotes || 'Vaccinations up to date. No known allergies.',

    // Travel Preferences
    minBudget: profile?.minBudget || '3500',
    maxBudget: profile?.maxBudget || '6000',
    transportPreference: profile?.transportPreference || 'car',
    hotelPreference: profile?.hotelPreference || '4-star',
    travelPace: profile?.travelPace || 'moderate',

    // Emergency Contact
    emergencyName: profile?.emergencyName || 'Jane Chen',
    emergencyPhone: profile?.emergencyPhone || '+86 138-0000-1234',
    emergencyRelation: profile?.emergencyRelation || 'Spouse',
  }), [profile]);
  const [formData, setFormData] = useState(baseFormData);

  useEffect(() => {
    setFormData(baseFormData);
  }, [baseFormData]);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const saveProfile = async () => {
    await onSaveProfile?.({ ...(profile || {}), ...formData } as UserProfile);
  };

  return (
    <div className="min-h-screen bg-[var(--cream-white)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-white">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <button
            onClick={() => onNavigate?.('home')}
            className="mb-4 flex items-center gap-2 px-3 py-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--deep-blue)] hover:bg-[var(--soft-grey)] transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" strokeWidth={2} />
            <span className="text-sm font-medium">Back to Home</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-[var(--deep-blue)] mb-1">
                Settings & Profile
              </h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                Manage your account and travel preferences
              </p>
            </div>

            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--warm-orange)] to-[var(--sage-green)] flex items-center justify-center text-white text-xl font-semibold">
              AC
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 py-8 space-y-6">
        {/* User Profile */}
        <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-[var(--light-sage)] to-white">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-[var(--sage-green)]" strokeWidth={2} />
              <h3 className="font-semibold text-[var(--deep-blue)]">User Profile</h3>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pet Profile */}
        <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-orange-50 to-white">
            <div className="flex items-center gap-2">
              <PawPrint className="w-5 h-5 text-[var(--warm-orange)]" strokeWidth={2} />
              <h3 className="font-semibold text-[var(--deep-blue)]">Pet Profile</h3>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">Pet Name</label>
                <input
                  type="text"
                  value={formData.petName}
                  onChange={(e) => updateField('petName', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">Type</label>
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
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">Breed</label>
                <input
                  type="text"
                  value={formData.breed}
                  onChange={(e) => updateField('breed', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">Age (years)</label>
                <input
                  type="text"
                  value={formData.age}
                  onChange={(e) => updateField('age', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">Weight (kg)</label>
                <input
                  type="text"
                  value={formData.weight}
                  onChange={(e) => updateField('weight', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">Health Status</label>
              <select
                value={formData.healthStatus}
                onChange={(e) => updateField('healthStatus', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
              >
                <option value="excellent">Excellent</option>
                <option value="healthy">Healthy</option>
                <option value="fair">Fair</option>
                <option value="needs-attention">Needs Attention</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">Health Notes</label>
              <textarea
                value={formData.healthNotes}
                onChange={(e) => updateField('healthNotes', e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Travel Preferences */}
        <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-blue-600" strokeWidth={2} />
              <h3 className="font-semibold text-[var(--deep-blue)]">Travel Preferences</h3>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">Min Budget (CNY)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.minBudget}
                  onChange={(e) => updateField('minBudget', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">Max Budget (CNY)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.maxBudget}
                  onChange={(e) => updateField('maxBudget', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">Transport Preference</label>
                <select
                  value={formData.transportPreference}
                  onChange={(e) => updateField('transportPreference', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                >
                  <option value="car">Private Car</option>
                  <option value="train">High-Speed Train</option>
                  <option value="mixed">Mixed Transport</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">Hotel Preference</label>
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
                <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">Travel Pace</label>
                <select
                  value={formData.travelPace}
                  onChange={(e) => updateField('travelPace', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                >
                  <option value="relaxed">Relaxed (4-5 hrs/day)</option>
                  <option value="moderate">Moderate (6-7 hrs/day)</option>
                  <option value="active">Active (8+ hrs/day)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-red-50 to-white">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" strokeWidth={2} />
              <h3 className="font-semibold text-[var(--deep-blue)]">Emergency Contact</h3>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">Contact Name</label>
                <input
                  type="text"
                  value={formData.emergencyName}
                  onChange={(e) => updateField('emergencyName', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.emergencyPhone}
                  onChange={(e) => updateField('emergencyPhone', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">Relationship</label>
              <input
                type="text"
                value={formData.emergencyRelation}
                onChange={(e) => updateField('emergencyRelation', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button onClick={saveProfile} className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--sage-green)] to-[var(--warm-orange)] text-white font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
            <Save className="w-5 h-5" strokeWidth={2} />
            <span>Save Changes</span>
          </button>
          <button className="px-6 py-3 rounded-xl border-2 border-red-500 text-red-600 font-medium hover:bg-red-50 transition-all flex items-center justify-center gap-2">
            <LogOut className="w-5 h-5" strokeWidth={2} />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
