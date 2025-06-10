"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Edit, 
  Trash2,
  Save,
  X,
  CheckCircle,
  XCircle,
  HelpCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

type ScheduleStatus = 'available' | 'busy' | 'maybe';

interface AvailabilitySlot {
  id?: string;
  day: string;
  startTime: string;
  endTime: string;
  status: ScheduleStatus;
  notes?: string;
  isRecurring: boolean;
  date?: string | null; // Changed from string | undefined to string | null
}

interface Session {
  id: string;
  scheduled_time: string;
  duration: number;
  status: string | null; // Changed from string to string | null
  student_name: string;
  student_avatar: string | null;
}

interface SupabaseSessionData {
  id: string;
  scheduled_time: string;
  duration: number;
  status: string | null; // Added null as possible type
  student: {
    name: string;
    avatar_url: string | null;
  } | null;
}

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const TIME_SLOTS = Array.from({ length: 24 * 2 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  const time = `${hour.toString().padStart(2, '0')}:${minute}`;
  return time;
});

const STATUS_CONFIG = {
  available: {
    label: 'Available',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    description: 'Open for booking sessions'
  },
  busy: {
    label: 'Busy',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    description: 'Not available for sessions'
  },
  maybe: {
    label: 'Maybe',
    icon: HelpCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    description: 'Tentatively available, contact first'
  }
};

export default function AvailabilityPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | null>(null);
  const [newSlot, setNewSlot] = useState<AvailabilitySlot>({
    day: 'Monday',
    startTime: '09:00',
    endTime: '17:00',
    status: 'available',
    notes: '',
    isRecurring: true
  });
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function checkCoachAccess() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          router.push('/sign-in');
          return;
        }

        // Check if user is a coach
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError || !profile || profile.role !== 'coach') {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this page.",
            variant: "destructive",
          });
          router.push('/dashboard');
          return;
        }

        setCurrentUser(user);
        await Promise.all([
          fetchAvailability(user.id),
          fetchSessions(user.id)
        ]);
      } catch (error: any) {
        console.error('Error checking coach access:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }

    checkCoachAccess();
  }, [router, toast]);

  async function fetchAvailability(coachId: string) {
    try {
      const { data, error } = await supabase
        .from('coach_availability')
        .select('*')
        .eq('coach_id', coachId)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;

      const slots = data?.map(slot => ({
        id: slot.id,
        day: DAYS_OF_WEEK[slot.day_of_week],
        startTime: slot.start_time,
        endTime: slot.end_time,
        status: (slot.status || 'available') as ScheduleStatus,
        notes: slot.notes || '',
        isRecurring: slot.is_recurring,
        date: slot.specific_date // This is now correctly typed as string | null
      })) || [];

      setAvailabilitySlots(slots);
    } catch (error: any) {
      console.error('Error fetching availability:', error);
      toast({
        title: "Error",
        description: "Failed to load availability. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function fetchSessions(coachId: string) {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          scheduled_time,
          duration,
          status,
          student_id
        `)
        .eq('coach_id', coachId)
        .gte('scheduled_time', new Date().toISOString())
        .order('scheduled_time');

      if (error) throw error;

      const formattedSessions = [];
      
      for (const session of data || []) {
        // Use the user_complete_profiles view which joins profiles and user_profiles
        const { data: studentProfile } = await supabase
          .from('user_complete_profiles')
          .select('name, avatar_url')
          .eq('id', session.student_id)
          .single();

        formattedSessions.push({
          id: session.id,
          scheduled_time: session.scheduled_time,
          duration: session.duration,
          status: session.status,
          student_name: studentProfile?.name || 'Unknown Student',
          student_avatar: studentProfile?.avatar_url || null
        });
      }

      setSessions(formattedSessions);
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
    }
}

  async function saveAvailabilitySlot(slot: AvailabilitySlot) {
    if (!currentUser) return;

    setSaving(true);
    try {
      const dayIndex = DAYS_OF_WEEK.indexOf(slot.day);
      
      const slotData = {
        coach_id: currentUser.id,
        day_of_week: dayIndex,
        start_time: slot.startTime,
        end_time: slot.endTime,
        status: slot.status,
        notes: slot.notes || null,
        is_recurring: slot.isRecurring,
        specific_date: slot.date || null
      };

      if (slot.id) {
        // Update existing slot
        const { error } = await supabase
          .from('coach_availability')
          .update(slotData)
          .eq('id', slot.id);

        if (error) throw error;
      } else {
        // Create new slot
        const { error } = await supabase
          .from('coach_availability')
          .insert(slotData);

        if (error) throw error;
      }

      await fetchAvailability(currentUser.id);
      setIsDialogOpen(false);
      setEditingSlot(null);
      setNewSlot({
        day: 'Monday',
        startTime: '09:00',
        endTime: '17:00',
        status: 'available',
        notes: '',
        isRecurring: true
      });

      toast({
        title: "Success",
        description: "Availability updated successfully.",
      });
    } catch (error: any) {
      console.error('Error saving availability:', error);
      toast({
        title: "Error",
        description: "Failed to save availability. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function deleteAvailabilitySlot(slotId: string) {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('coach_availability')
        .delete()
        .eq('id', slotId);

      if (error) throw error;

      await fetchAvailability(currentUser.id);
      toast({
        title: "Success",
        description: "Availability slot deleted successfully.",
      });
    } catch (error: any) {
      console.error('Error deleting availability:', error);
      toast({
        title: "Error",
        description: "Failed to delete availability slot. Please try again.",
        variant: "destructive",
      });
    }
  }

  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const getSessionsForDay = (date: Date) => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.scheduled_time);
      return sessionDate.toDateString() === date.toDateString();
    });
  };

  const getAvailabilityForDay = (dayName: string) => {
    return availabilitySlots.filter(slot => slot.day === dayName && slot.isRecurring);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const getStatusBadgeVariant = (status: ScheduleStatus) => {
    switch (status) {
      case 'available':
        return 'default';
      case 'busy':
        return 'destructive';
      case 'maybe':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const weekDates = getWeekDates(currentDate);

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 mb-4"
          asChild
        >
          <Link href="/dashboard">
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Manage Availability</h1>
            <p className="text-muted-foreground">Set your coaching schedule with availability status</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Schedule Block
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingSlot ? 'Edit Schedule Block' : 'Add Schedule Block'}
                </DialogTitle>
                <DialogDescription>
                  Set your schedule status and availability hours
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="day">Day of Week</Label>
                  <Select
                    value={editingSlot?.day || newSlot.day}
                    onValueChange={(value) => {
                      if (editingSlot) {
                        setEditingSlot({ ...editingSlot, day: value });
                      } else {
                        setNewSlot({ ...newSlot, day: value });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map(day => (
                        <SelectItem key={day} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-3">
                  <Label>Schedule Status</Label>
                  <RadioGroup
                    value={editingSlot?.status || newSlot.status}
                    onValueChange={(value: ScheduleStatus) => {
                      if (editingSlot) {
                        setEditingSlot({ ...editingSlot, status: value });
                      } else {
                        setNewSlot({ ...newSlot, status: value });
                      }
                    }}
                    className="grid gap-3"
                  >
                    {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                      const Icon = config.icon;
                      return (
                        <div key={status} className="flex items-center space-x-3">
                          <RadioGroupItem value={status} id={status} />
                          <Label htmlFor={status} className="flex items-center gap-2 cursor-pointer">
                            <Icon className={`h-4 w-4 ${config.color}`} />
                            <div>
                              <div className="font-medium">{config.label}</div>
                              <div className="text-xs text-muted-foreground">{config.description}</div>
                            </div>
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Select
                      value={editingSlot?.startTime || newSlot.startTime}
                      onValueChange={(value) => {
                        if (editingSlot) {
                          setEditingSlot({ ...editingSlot, startTime: value });
                        } else {
                          setNewSlot({ ...newSlot, startTime: value });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Select
                      value={editingSlot?.endTime || newSlot.endTime}
                      onValueChange={(value) => {
                        if (editingSlot) {
                          setEditingSlot({ ...editingSlot, endTime: value });
                        } else {
                          setNewSlot({ ...newSlot, endTime: value });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any additional notes about this time slot..."
                    value={editingSlot?.notes || newSlot.notes}
                    onChange={(e) => {
                      if (editingSlot) {
                        setEditingSlot({ ...editingSlot, notes: e.target.value });
                      } else {
                        setNewSlot({ ...newSlot, notes: e.target.value });
                      }
                    }}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingSlot(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => saveAvailabilitySlot(editingSlot || newSlot)}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Status Legend */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Schedule Status Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(STATUS_CONFIG).map(([status, config]) => {
              const Icon = config.icon;
              return (
                <div key={status} className={`flex items-center gap-3 p-3 rounded-lg border ${config.borderColor} ${config.bgColor}`}>
                  <Icon className={`h-5 w-5 ${config.color}`} />
                  <div>
                    <div className="font-medium">{config.label}</div>
                    <div className="text-sm text-muted-foreground">{config.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Calendar Navigation */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                <h2 className="text-lg font-semibold">
                  {weekDates[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Weekly Calendar View */}
      <div className="grid grid-cols-7 gap-4 mb-8">
        {weekDates.map((date, index) => {
          const dayName = DAYS_OF_WEEK[date.getDay()];
          const dayAvailability = getAvailabilityForDay(dayName);
          const daySessions = getSessionsForDay(date);
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <Card key={index} className={`${isToday ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader className="pb-2">
                <div className="text-center">
                  <div className="text-sm font-medium">{dayName}</div>
                  <div className={`text-lg ${isToday ? 'font-bold text-primary' : ''}`}>
                    {date.getDate()}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {/* Availability Slots */}
                {dayAvailability.map((slot, slotIndex) => {
                  const config = STATUS_CONFIG[slot.status];
                  const Icon = config.icon;
                  
                  return (
                    <div
                      key={slotIndex}
                      className={`p-2 rounded text-xs border ${config.borderColor} ${config.bgColor}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          <Icon className={`h-3 w-3 ${config.color}`} />
                          <span className="font-medium">{config.label}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={() => {
                              setEditingSlot(slot);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-red-600"
                            onClick={() => slot.id && deleteAvailabilitySlot(slot.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {slot.startTime} - {slot.endTime}
                      </div>
                      {slot.notes && (
                        <div className="text-xs text-muted-foreground mt-1 truncate" title={slot.notes}>
                          {slot.notes}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Scheduled Sessions */}
                {daySessions.map((session, sessionIndex) => (
                  <div
                    key={sessionIndex}
                    className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs border border-blue-200 dark:border-blue-800"
                  >
                    <div className="font-medium text-blue-700 dark:text-blue-300">
                      {new Date(session.scheduled_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="text-blue-600 dark:text-blue-400">
                      {session.student_name}
                    </div>
                    <Badge
                      variant={session.status === 'scheduled' ? 'secondary' : 'default'}
                      className="text-xs mt-1"
                    >
                      {session.status || 'pending'}
                    </Badge>
                  </div>
                ))}

                {dayAvailability.length === 0 && daySessions.length === 0 && (
                  <div className="text-center text-muted-foreground text-xs py-4">
                    No schedule set
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Current Availability Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule Summary</CardTitle>
          <CardDescription>
            Your recurring weekly schedule with status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {DAYS_OF_WEEK.map(day => {
              const daySlots = getAvailabilityForDay(day);
              return (
                <div key={day} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="font-medium w-24">{day}</div>
                  <div className="flex-1">
                    {daySlots.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {daySlots.map((slot, index) => {
                          const config = STATUS_CONFIG[slot.status];
                          const Icon = config.icon;
                          
                          return (
                            <div key={index} className="flex items-center gap-1">
                              <Badge variant={getStatusBadgeVariant(slot.status)} className="gap-1">
                                <Icon className="h-3 w-3" />
                                {slot.startTime} - {slot.endTime}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No schedule set</span>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewSlot({
                        day,
                        startTime: '09:00',
                        endTime: '17:00',
                        status: 'available',
                        notes: '',
                        isRecurring: true
                      });
                      setIsDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}