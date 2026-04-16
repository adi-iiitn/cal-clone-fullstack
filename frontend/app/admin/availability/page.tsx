'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { getAvailability, updateAvailability, Availability } from '@/lib/api';

const DAYS = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

interface DayAvailability {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

type WeekAvailability = Record<number, DayAvailability>;

export default function AvailabilityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [weekAvailability, setWeekAvailability] = useState<WeekAvailability>({
    0: { enabled: false, startTime: '09:00', endTime: '17:00' },
    1: { enabled: true, startTime: '09:00', endTime: '17:00' },
    2: { enabled: true, startTime: '09:00', endTime: '17:00' },
    3: { enabled: true, startTime: '09:00', endTime: '17:00' },
    4: { enabled: true, startTime: '09:00', endTime: '17:00' },
    5: { enabled: true, startTime: '09:00', endTime: '17:00' },
    6: { enabled: false, startTime: '09:00', endTime: '17:00' },
  });

  // Load existing availability
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const data = await getAvailability();
        
        // Convert array to weekAvailability object
        const newWeekAvailability: WeekAvailability = { ...weekAvailability };
        
        // Reset all to disabled first
        DAYS.forEach(day => {
          newWeekAvailability[day.value] = {
            enabled: false,
            startTime: '09:00',
            endTime: '17:00',
          };
        });
        
        // Set enabled days from API
        data.forEach((availability: Availability) => {
          newWeekAvailability[availability.dayOfWeek] = {
            enabled: true,
            startTime: availability.startTime,
            endTime: availability.endTime,
          };
        });
        
        setWeekAvailability(newWeekAvailability);
      } catch (err) {
        console.error('Failed to fetch availability:', err);
        setError('Failed to load availability settings');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, []);

  const toggleDay = (dayValue: number) => {
    setWeekAvailability(prev => ({
      ...prev,
      [dayValue]: {
        ...prev[dayValue],
        enabled: !prev[dayValue].enabled,
      },
    }));
  };

  const updateTime = (dayValue: number, field: 'startTime' | 'endTime', value: string) => {
    setWeekAvailability(prev => ({
      ...prev,
      [dayValue]: {
        ...prev[dayValue],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Convert weekAvailability to array format for API
      const availabilityArray = DAYS
        .filter(day => weekAvailability[day.value].enabled)
        .map(day => ({
          dayOfWeek: day.value,
          startTime: weekAvailability[day.value].startTime,
          endTime: weekAvailability[day.value].endTime,
          timezone: 'UTC',
        }));

      console.log('Saving availability:', availabilityArray);

      await updateAvailability(availabilityArray);
      
      setSuccess('✅ Availability settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to save availability:', err);
      setError('Failed to save availability settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const applyToAllDays = () => {
    const mondaySettings = weekAvailability[1];
    const newSettings: WeekAvailability = {};
    
    DAYS.forEach(day => {
      newSettings[day.value] = {
        enabled: day.value >= 1 && day.value <= 5, // Mon-Fri
        startTime: mondaySettings.startTime,
        endTime: mondaySettings.endTime,
      };
    });
    
    setWeekAvailability(newSettings);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading availability settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold">Cal Clone</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2 text-gray-900">Availability Settings</h2>
            <p className="text-gray-600">
              Set your weekly availability schedule. Only enabled days will show time slots for booking.
            </p>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              {success}
            </div>
          )}
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Weekly Schedule</CardTitle>
                  <CardDescription>Configure your available hours for each day of the week</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={applyToAllDays}
                >
                  Apply Mon-Fri (9-5)
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {DAYS.map((day) => (
                  <div
                    key={day.value}
                    className={`p-4 border rounded-lg transition-colors ${
                      weekAvailability[day.value].enabled
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Day Toggle */}
                      <div className="flex items-center gap-3 w-40">
                        <input
                          type="checkbox"
                          id={`day-${day.value}`}
                          checked={weekAvailability[day.value].enabled}
                          onChange={() => toggleDay(day.value)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-600"
                        />
                        <label
                          htmlFor={`day-${day.value}`}
                          className="font-semibold text-gray-900 cursor-pointer"
                        >
                          {day.label}
                        </label>
                      </div>

                      {/* Time Pickers */}
                      {weekAvailability[day.value].enabled ? (
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <input
                              type="time"
                              value={weekAvailability[day.value].startTime}
                              onChange={(e) => updateTime(day.value, 'startTime', e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                            />
                          </div>
                          <span className="text-gray-500">to</span>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <input
                              type="time"
                              value={weekAvailability[day.value].endTime}
                              onChange={(e) => updateTime(day.value, 'endTime', e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500 italic">Unavailable</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Save Button */}
              <div className="mt-6 pt-6 border-t">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  size="lg"
                  className="w-full"
                >
                  <Save className="h-5 w-5 mr-2" />
                  {saving ? 'Saving...' : 'Save Availability Settings'}
                </Button>
              </div>

              {/* Info */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tip:</strong> Time slots are generated in 30-minute intervals based on your event type duration.
                  Only enabled days will appear in the booking calendar.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
