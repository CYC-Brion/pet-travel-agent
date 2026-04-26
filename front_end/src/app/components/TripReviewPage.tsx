import { useMemo, useState } from 'react';
import { ArrowLeft, Star, MapPin, Hotel, PawPrint, Shield, DollarSign, Calendar, ChevronRight } from 'lucide-react';

interface TripReviewPageProps {
  onNavigate?: (view: string) => void;
  review?: {
    name?: string;
    dates?: string;
    hotel?: string;
    rating?: number;
    spending?: Array<{ category: string; amount: string; percentage: number }>;
    placesVisited?: Array<{ name: string; type?: string; petFriendly?: boolean }>;
    petMilestones?: Array<{ label: string; value: string }>;
    notes?: string;
  } | null;
  onSaveReview?: (payload: { rating: number; notes: string }) => Promise<void>;
}

export function TripReviewPage({ onNavigate, review, onSaveReview }: TripReviewPageProps) {
  const tripData = {
    name: review?.name || 'Hangzhou 3-Day Pet-Friendly Trip',
    dates: review?.dates || 'May 15-17, 2026',
    hotel: review?.hotel || 'West Lake Pet-Friendly Hotel',
    rating: review?.rating || 4.5,
  };

  const fallbackSpending = [
    { category: 'Hotel', amount: '¥2,040', percentage: 45 },
    { category: 'Transport', amount: '¥630', percentage: 14 },
    { category: 'Meals', amount: '¥890', percentage: 20 },
    { category: 'Attractions', amount: '¥520', percentage: 12 },
    { category: 'Other', amount: '¥420', percentage: 9 },
  ];
  const spending = review?.spending?.length ? review.spending : fallbackSpending;
  const totalSpent = spending.reduce((sum, item) => sum + parseInt(item.amount.replace(/[^0-9]/g, ''), 10), 0);

  const fallbackPlacesVisited = [
    { name: 'West Lake Scenic Area', type: 'Nature', petFriendly: true },
    { name: 'Prince Bay Park', type: 'Park', petFriendly: true },
    { name: 'Yunqi Bamboo Trail', type: 'Nature', petFriendly: true },
    { name: 'Longjing Tea Village', type: 'Culture', petFriendly: true },
  ];
  const placesVisited = review?.placesVisited?.length ? review.placesVisited : fallbackPlacesVisited;

  const fallbackPetMilestones = [
    { label: 'Pet-friendly stops completed', value: '4' },
    { label: 'Total distance walked', value: '12.5 km' },
    { label: 'Days without incidents', value: '3' },
    { label: 'New places explored', value: '4' },
  ];
  const petMilestones = review?.petMilestones?.length ? review.petMilestones : fallbackPetMilestones;
  const milestoneIcons = useMemo(() => [PawPrint, MapPin, Shield, Star], []);

  const [userRating, setUserRating] = useState(tripData.rating);
  const [reviewNotes, setReviewNotes] = useState(review?.notes || '');

  return (
    <div className="min-h-screen bg-[var(--cream-white)]">
      <div className="border-b border-[var(--border)] bg-white">
        <div className="max-w-5xl mx-auto px-8 py-6">
          <button
            onClick={() => onNavigate?.('home')}
            className="mb-4 flex items-center gap-2 px-3 py-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--deep-blue)] hover:bg-[var(--soft-grey)] transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" strokeWidth={2} />
            <span className="text-sm font-medium">Back to Home</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-[var(--deep-blue)] mb-1">Trip Review</h1>
              <p className="text-sm text-[var(--muted-foreground)]">{tripData.name} · {tripData.dates}</p>
            </div>

            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 cursor-pointer transition-colors ${star <= userRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                  strokeWidth={2}
                  onClick={() => setUserRating(star)}
                />
              ))}
              <span className="ml-2 text-lg font-semibold text-[var(--deep-blue)]">{userRating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="col-span-2">
            <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
              <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-blue-600" strokeWidth={2} />
                    <h3 className="font-semibold text-[var(--deep-blue)]">Spending Breakdown</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[var(--muted-foreground)]">Total Spent</p>
                    <p className="text-2xl font-bold text-[var(--sage-green)]">¥{totalSpent.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {spending.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[var(--deep-blue)]">{item.category}</span>
                      <span className="text-sm font-semibold text-[var(--deep-blue)]">{item.amount}</span>
                    </div>
                    <div className="h-2 bg-[var(--soft-grey)] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[var(--sage-green)] to-[var(--warm-orange)]" style={{ width: `${item.percentage}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-green-50 to-white">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" strokeWidth={2} />
                <h3 className="font-semibold text-[var(--deep-blue)]">Trip Stats</h3>
              </div>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div>
                <p className="text-[var(--muted-foreground)] mb-1">Duration</p>
                <p className="font-semibold text-[var(--deep-blue)]">3 days</p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)] mb-1">Hotel</p>
                <p className="font-semibold text-[var(--deep-blue)]">{tripData.hotel}</p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)] mb-1">Places Visited</p>
                <p className="font-semibold text-[var(--deep-blue)]">{placesVisited.length} locations</p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)] mb-1">Pet Companion</p>
                <p className="font-semibold text-[var(--deep-blue)]">Biscuit</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden mb-8">
          <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-[var(--light-sage)] to-white">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[var(--sage-green)]" strokeWidth={2} />
              <h3 className="font-semibold text-[var(--deep-blue)]">Places Visited</h3>
            </div>
          </div>

          <div className="p-6 grid grid-cols-2 gap-4">
            {placesVisited.map((place, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-[var(--border)] hover:border-[var(--sage-green)] hover:shadow-sm transition-all">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-[var(--deep-blue)]">{place.name}</h4>
                  {place.petFriendly && <PawPrint className="w-4 h-4 text-green-600" strokeWidth={2} />}
                </div>
                <span className="text-sm text-[var(--muted-foreground)]">{place.type || 'Location'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden mb-8">
          <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-orange-50 to-white">
            <div className="flex items-center gap-2">
              <PawPrint className="w-5 h-5 text-[var(--warm-orange)]" strokeWidth={2} />
              <h3 className="font-semibold text-[var(--deep-blue)]">Pet Milestones</h3>
            </div>
          </div>

          <div className="p-6 grid grid-cols-4 gap-4">
            {petMilestones.map((milestone, idx) => {
              const Icon = milestoneIcons[idx] || Star;
              return (
                <div key={idx} className="p-4 rounded-lg bg-[var(--soft-grey)] text-center">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--sage-green)] to-[var(--warm-orange)] flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                  <p className="text-2xl font-bold text-[var(--sage-green)] mb-1">{milestone.value}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{milestone.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden mb-8">
          <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-blue-50 to-white">
            <h3 className="font-semibold text-[var(--deep-blue)]">Your Notes</h3>
          </div>
          <div className="p-6">
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all resize-none"
              placeholder="Add your trip highlights and your pet's experience..."
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => onNavigate?.('home')}
            className="px-6 py-4 rounded-xl border-2 border-[var(--border)] text-[var(--deep-blue)] font-medium hover:bg-[var(--soft-grey)] transition-all"
          >
            Back to Home
          </button>
          <button
            onClick={async () => {
              await onSaveReview?.({ rating: userRating, notes: reviewNotes });
              onNavigate?.('home');
            }}
            className="px-6 py-4 rounded-xl border-2 border-[var(--sage-green)] text-[var(--sage-green)] font-medium hover:bg-[var(--light-sage)] transition-all"
          >
            Save Review
          </button>
          <button
            onClick={() => onNavigate?.('info')}
            className="px-6 py-4 rounded-xl bg-gradient-to-r from-[var(--sage-green)] to-[var(--warm-orange)] text-white font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <span>Plan Similar Trip</span>
            <ChevronRight className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
