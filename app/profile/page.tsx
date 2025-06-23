"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2, Upload, CheckCircle, AlertCircle, Star, Users, DollarSign, BookOpen, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Database } from "@/lib/types"; // Adjust path as needed

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Type aliases for database enums
type VerificationStatus = Database["public"]["Enums"]["verification_status"];
type StudentLevel = Database["public"]["Enums"]["student_level"];

// Custom interface for Supabase storage errors (since StorageError type is incomplete)
interface SupabaseStorageError {
  message: string;
  statusCode?: string;
  error?: string;
  name?: string;
  cause?: any;
}

// Enhanced schema with role-specific fields (role removed as it's read-only)
const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  bio: z.string().max(500, { message: "Bio must be less than 500 characters" }).optional(),
  website: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
  // Coach-specific fields
  hourly_rate: z.number().min(0, { message: "Rate must be positive" }).optional(),
  expertise_areas: z.array(z.object({
    value: z.string().min(1, { message: "Expertise area cannot be empty" })
  })).optional(),
  algorand_wallet: z.string().optional(),
  video_intro_url: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  // Student-specific fields
  current_level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  learning_goals: z.array(z.object({
    value: z.string().min(1, { message: "Learning goal cannot be empty" })
  })).optional(),
  selected_path: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Enhanced interface with all possible fields
interface FullUserProfile {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  subscription_status: string | null;
  bio: string | null;
  website: string | null;
  twitter: string | null;
  linkedin: string | null;
  avatar_url: string | null;
  profile_complete: boolean;
  // Coach-specific fields
  verification_status?: VerificationStatus | null;
  rating?: number | null;
  total_students?: number | null;
  earnings?: number | null;
  hourly_rate?: number | null;
  expertise_areas?: string[] | null;
  algorand_wallet?: string | null;
  subscription_active?: boolean | null;
  subscription_required?: boolean | null;
  video_intro_url?: string | null;
  // Student-specific fields
  current_level?: StudentLevel | null;
  tokens_earned?: number | null;
  courses_completed?: string[] | null;
  learning_goals?: string[] | null;
  selected_coach_id?: string | null;
  selected_path?: string | null;
}

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [authProvider, setAuthProvider] = useState<string | null>(null);
  const [fullProfileData, setFullProfileData] = useState<FullUserProfile | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      bio: "",
      website: "",
      twitter: "",
      linkedin: "",
      hourly_rate: 0,
      expertise_areas: [],
      algorand_wallet: "",
      video_intro_url: "",
      current_level: "beginner",
      learning_goals: [],
      selected_path: "",
    },
  });

  // Field arrays for dynamic fields
  const {
    fields: expertiseFields,
    append: appendExpertise,
    remove: removeExpertise,
  } = useFieldArray({
    control: form.control,
    name: "expertise_areas",
  });

  const {
    fields: goalFields,
    append: appendGoal,
    remove: removeGoal,
  } = useFieldArray({
    control: form.control,
    name: "learning_goals",
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          router.push('/sign-in');
          return;
        }

        // Check if user is OAuth user
        const isOAuth = user.app_metadata.provider !== 'email';
        const provider = user.app_metadata.provider ?? null;
        setIsOAuthUser(isOAuth);
        setAuthProvider(provider);

        // Get base profile data from 'profiles' table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, email, role, subscription_status')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // Get user profile data from 'user_profiles' table
        const { data: userProfileData, error: userProfileError } = await supabase
          .from('user_profiles')
          .select('bio, website, twitter, linkedin, avatar_url, profile_complete')
          .eq('prof_id', user.id)
          .maybeSingle();

        if (userProfileError) throw userProfileError;

        setProfileComplete(userProfileData?.profile_complete || false);

        // For OAuth users, try to get info from user metadata if profile is incomplete
        let initialName = profileData?.name;
        let initialAvatarUrl = userProfileData?.avatar_url;

        if (isOAuth && !userProfileData?.profile_complete) {
          if (!initialName) {
            initialName = user.user_metadata?.full_name || 
                         user.user_metadata?.name || 
                         user.user_metadata?.display_name || 
                         "";
          }
          if (!initialAvatarUrl) {
            initialAvatarUrl = user.user_metadata?.avatar_url || 
                              user.user_metadata?.picture || 
                              null;
          }
        }

        setAvatarUrl(initialAvatarUrl ?? null);
        
        // Combine base profile and user profile data
        let combinedProfile: FullUserProfile = {
          id: user.id,
          name: initialName || null,
          email: profileData.email || null,
          role: profileData.role || null,
          subscription_status: profileData.subscription_status || null,
          bio: userProfileData?.bio || null,
          website: userProfileData?.website || null,
          twitter: userProfileData?.twitter || null,
          linkedin: userProfileData?.linkedin || null,
          avatar_url: initialAvatarUrl || null,
          profile_complete: userProfileData?.profile_complete || false,
        };

        // Fetch role-specific data
        if (profileData.role === 'coach') {
          const { data: coachData, error: coachError } = await supabase
            .from('coach_profiles')
            .select('*')
            .eq('coach_id', user.id)
            .maybeSingle();
          if (coachError) console.error('Error fetching coach profile data:', coachError);
          if (coachData) {
            combinedProfile = { ...combinedProfile, ...coachData };
          }
        } else if (profileData.role === 'student') {
          const { data: studentData, error: studentError } = await supabase
            .from('student_profiles')
            .select('*')
            .eq('student_id', user.id)
            .maybeSingle();
          if (studentError) console.error('Error fetching student profile data:', studentError);
          if (studentData) {
            combinedProfile = { ...combinedProfile, ...studentData };
          }
        }

        setFullProfileData(combinedProfile);

        // Reset form with the correct data, including role-specific fields
        form.reset({
          name: combinedProfile.name || "",
          bio: combinedProfile.bio || "",
          website: combinedProfile.website || "",
          twitter: combinedProfile.twitter || "",
          linkedin: combinedProfile.linkedin || "",
          // Coach fields
          hourly_rate: combinedProfile.hourly_rate || 0,
          expertise_areas: (combinedProfile.expertise_areas || []).map(area => ({ value: area })),
          algorand_wallet: combinedProfile.algorand_wallet || "",
          video_intro_url: combinedProfile.video_intro_url || "",
          // Student fields
          current_level: (combinedProfile.current_level as "beginner" | "intermediate" | "advanced") || "beginner",
          learning_goals: (combinedProfile.learning_goals || []).map(goal => ({ value: goal })),
          selected_path: combinedProfile.selected_path || "",
        });

      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [form, router, toast]);

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({
        title: "Error",
        description: "File must be JPEG, PNG, or WebP",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    setSelectedFile(file);
    setShowPreviewDialog(true);
  }

  async function confirmAvatarUpload() {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Authentication error:', userError);
        throw new Error(`Authentication failed: ${userError.message}`);
      }
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('User authenticated:', user.id);

      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;
      
      console.log('Attempting upload to path:', filePath);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, selectedFile, { upsert: true });

      if (uploadError) {
        // Handle the actual error structure returned by Supabase Storage
        const errorDetails = uploadError as SupabaseStorageError;
        console.error('Storage upload error:', {
          message: errorDetails.message || uploadError.message,
          statusCode: errorDetails.statusCode,
          error: errorDetails.error,
          name: uploadError.name,
          cause: errorDetails.cause
        });
        
        // Provide user-friendly error messages
        let errorMessage = "Failed to upload profile photo";
        if (errorDetails.message) {
          if (errorDetails.message.includes("row-level security")) {
            errorMessage = "Upload permission denied. Please contact support.";
          } else if (errorDetails.message.includes("Invalid")) {
            errorMessage = "Invalid file format or size. Please try a different image.";
          } else {
            errorMessage = errorDetails.message;
          }
        }
        
        throw new Error(errorMessage);
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log('Public URL generated:', publicUrl);

      // Update avatar_url in user_profiles table
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({ 
          prof_id: user.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'prof_id'
        });

      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      setAvatarUrl(publicUrl);
      toast({
        title: "Success",
        description: "Profile photo updated successfully",
      });
    } catch (error) {
      // Proper error handling for unknown type
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : undefined;
      const errorCause = error instanceof Error ? (error as any).cause : undefined;
      
      console.error('Error uploading avatar:', {
        message: errorMessage,
        stack: errorStack,
        cause: errorCause,
        error: error
      });
      
      toast({
        title: "Error",
        description: errorMessage || "Failed to upload profile photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setShowPreviewDialog(false);
      setPreviewImage(null);
      setSelectedFile(null);
    }
  }

  async function onSubmit(data: ProfileFormValues) {
    setIsSaving(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Not authenticated');
      }

      // Update name in profiles table (role is not updatable)
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileUpdateError) throw profileUpdateError;

      // Update profile details in user_profiles table
      const { error: userProfileUpdateError } = await supabase
        .from('user_profiles')
        .upsert({
          prof_id: user.id,
          bio: data.bio ?? null,
          website: data.website ?? null,
          twitter: data.twitter ?? null,
          linkedin: data.linkedin ?? null,
          profile_complete: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'prof_id'
        });

      if (userProfileUpdateError) throw userProfileUpdateError;

      // Handle role-specific updates based on current role
      if (fullProfileData?.role === 'coach') {
        const expertiseAreas = data.expertise_areas?.map(item => item.value).filter(Boolean) || [];
        
        // Ensure we're using the correct verification status type
        const currentVerificationStatus: VerificationStatus = 
          (fullProfileData?.verification_status as VerificationStatus) || 'pending';
        
        const { error: coachProfileError } = await supabase
          .from('coach_profiles')
          .upsert({
            coach_id: user.id,
            hourly_rate: data.hourly_rate || 0,
            expertise_areas: expertiseAreas,
            algorand_wallet: data.algorand_wallet || null,
            video_intro_url: data.video_intro_url || null,
            // Keep existing system-managed fields with proper types
            verification_status: currentVerificationStatus,
            rating: fullProfileData?.rating || 0,
            total_students: fullProfileData?.total_students || 0,
            earnings: fullProfileData?.earnings || 0,
            subscription_active: fullProfileData?.subscription_active || false,
            subscription_required: fullProfileData?.subscription_required || false,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'coach_id'
          });

        if (coachProfileError) throw coachProfileError;
      } else if (fullProfileData?.role === 'student') {
        const learningGoals = data.learning_goals?.map(item => item.value).filter(Boolean) || [];
        
        // Ensure we're using the correct student level type
        const currentLevel: StudentLevel = 
          (data.current_level as StudentLevel) || 'beginner';
        
        const { error: studentProfileError } = await supabase
          .from('student_profiles')
          .upsert({
            student_id: user.id,
            current_level: currentLevel,
            learning_goals: learningGoals,
            selected_path: data.selected_path || null,
            // Keep existing system-managed fields
            tokens_earned: fullProfileData?.tokens_earned || 0,
            courses_completed: fullProfileData?.courses_completed || [],
            selected_coach_id: fullProfileData?.selected_coach_id || null,
            subscription_required: fullProfileData?.subscription_required || false,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'student_id'
          });

        if (studentProfileError) throw studentProfileError;
      }

      // For OAuth users, also update their auth metadata
      if (isOAuthUser) {
        const { error: authUpdateError } = await supabase.auth.updateUser({
          data: {
            profile_complete: true,
          }
        });

        if (authUpdateError) {
          console.warn('Failed to update auth metadata:', authUpdateError);
        }
      }

      setProfileComplete(true);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });

      // Update local state
      setFullProfileData(prev => ({
        ...(prev as FullUserProfile),
        name: data.name,
        bio: data.bio ?? null,
        website: data.website ?? null,
        twitter: data.twitter ?? null,
        linkedin: data.linkedin ?? null,
        profile_complete: true,
        ...(fullProfileData?.role === 'coach' && {
          hourly_rate: data.hourly_rate,
          expertise_areas: data.expertise_areas?.map(item => item.value).filter(Boolean),
          algorand_wallet: data.algorand_wallet,
          video_intro_url: data.video_intro_url,
        }),
        ...(fullProfileData?.role === 'student' && {
          current_level: data.current_level as StudentLevel,
          learning_goals: data.learning_goals?.map(item => item.value).filter(Boolean),
          selected_path: data.selected_path,
        }),
      }));

    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Profile
                {profileComplete ? (
                  <Badge variant="default" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Complete
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Incomplete
                  </Badge>
                )}
              </CardTitle>
              {isOAuthUser && (
                <Badge variant="secondary" className="text-xs mt-2">
                  {authProvider === 'google' ? 'Google Account' : 
                   authProvider === 'apple' ? 'Apple Account' : 
                   `${authProvider} Account`}
                </Badge>
              )}
            </div>
          </div>
          <CardDescription>
            Manage your public profile information
            {!profileComplete && " (Please complete your profile)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Avatar Upload Section */}
          <div className="mb-8 flex flex-col items-center">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl || undefined} alt="Profile photo" />
                <AvatarFallback>
                  {form.getValues("name")?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2">
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="rounded-full bg-primary p-2 text-primary-foreground shadow-sm hover:bg-primary/90">
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </div>
                  <Input
                    id="avatar-upload"
                    name="avatar-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isUploading}
                    aria-label="Upload profile photo"
                  />
                </Label>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground text-center">
              Upload a photo for your profile
              {isOAuthUser && avatarUrl && (
                <span className="block text-xs mt-1">
                  Current photo from {authProvider}
                </span>
              )}
            </p>
          </div>

          {/* Role Display Section (Read-only) */}
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <Label className="text-sm font-medium">Current Role</Label>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {fullProfileData?.role || 'Not Set'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {fullProfileData?.role === 'coach' ? 'Teach Trading' : 
                 fullProfileData?.role === 'student' ? 'Learn Trading' : 
                 'Role not assigned'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Role is assigned by administrators and cannot be changed here.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Profile Fields */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="profile-name">Name *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        id="profile-name"
                        name="name"
                        placeholder="Your full name" 
                        autoComplete="name"
                        aria-describedby="name-description"
                      />
                    </FormControl>
                    <FormDescription id="name-description">
                      Your full name as it will appear to other users
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="profile-bio">Bio</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field}
                        id="profile-bio"
                        name="bio"
                        placeholder="Tell us about yourself..."
                        className="resize-none"
                        autoComplete="off"
                        aria-describedby="bio-description"
                      />
                    </FormControl>
                    <FormDescription id="bio-description">
                      Write a brief bio about your trading experience and expertise (max 500 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="profile-website">Website</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        id="profile-website"
                        name="website"
                        type="url"
                        placeholder="https://your-website.com" 
                        autoComplete="url"
                        aria-describedby="website-description"
                      />
                    </FormControl>
                    <FormDescription id="website-description">
                      Your personal or business website
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="twitter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="profile-twitter">Twitter</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        id="profile-twitter"
                        name="twitter"
                        placeholder="@username" 
                        autoComplete="off"
                        aria-describedby="twitter-description"
                      />
                    </FormControl>
                    <FormDescription id="twitter-description">
                      Your Twitter/X username
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="profile-linkedin">LinkedIn</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        id="profile-linkedin"
                        name="linkedin"
                        type="url"
                        placeholder="Your LinkedIn profile URL" 
                        autoComplete="url"
                        aria-describedby="linkedin-description"
                      />
                    </FormControl>
                    <FormDescription id="linkedin-description">
                      Your LinkedIn profile URL
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Coach-specific fields */}
              {fullProfileData?.role === "coach" && (
                <>
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Coach Information</h3>
                    
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="hourly_rate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="coach-hourly-rate">Hourly Rate ($)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                id="coach-hourly-rate"
                                name="hourly_rate"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="50.00" 
                                autoComplete="off"
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                aria-describedby="hourly-rate-description"
                              />
                            </FormControl>
                            <FormDescription id="hourly-rate-description">
                              Your hourly rate for coaching sessions in USD
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div>
                        <Label className="text-sm font-medium">Expertise Areas</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Add your areas of trading expertise
                        </p>
                        {expertiseFields.map((field, index) => (
                          <FormField
                            key={field.id}
                            control={form.control}
                            name={`expertise_areas.${index}.value`}
                            render={({ field }) => (
                              <FormItem className="mb-3">
                                <div className="flex gap-2">
                                  <FormControl>
                                    <Input 
                                      {...field}
                                      id={`expertise-${index}`}
                                      name={`expertise_areas.${index}.value`}
                                      placeholder="e.g., Day Trading, Options, Forex" 
                                      autoComplete="off"
                                      aria-label={`Expertise area ${index + 1}`}
                                    />
                                  </FormControl>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => removeExpertise(index)}
                                    aria-label={`Remove expertise area ${index + 1}`}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => appendExpertise({ value: "" })}
                          className="mt-2"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Expertise Area
                        </Button>
                      </div>

                      <FormField
                        control={form.control}
                        name="algorand_wallet"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="coach-algorand-wallet">Algorand Wallet Address</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                id="coach-algorand-wallet"
                                name="algorand_wallet"
                                placeholder="Your Algorand wallet address" 
                                autoComplete="off"
                                aria-describedby="algorand-wallet-description"
                              />
                            </FormControl>
                            <FormDescription id="algorand-wallet-description">
                              For receiving payments (optional)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="video_intro_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="coach-video-intro">Video Introduction URL</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                id="coach-video-intro"
                                name="video_intro_url"
                                type="url"
                                placeholder="https://youtube.com/watch?v=..." 
                                autoComplete="url"
                                aria-describedby="video-intro-description"
                              />
                            </FormControl>
                            <FormDescription id="video-intro-description">
                              Link to your introduction video (optional)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Student-specific fields */}
              {fullProfileData?.role === "student" && (
                <>
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Student Information</h3>
                    
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="current_level"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="student-level">Current Trading Level</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              name="current_level"
                            >
                              <FormControl>
                                <SelectTrigger id="student-level" aria-describedby="level-description">
                                  <SelectValue placeholder="Select your level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="beginner">Beginner</SelectItem>
                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                <SelectItem value="advanced">Advanced</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription id="level-description">
                              Your current trading experience level
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div>
                        <Label className="text-sm font-medium">Learning Goals</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                          What do you want to learn about trading?
                        </p>
                        {goalFields.map((field, index) => (
                          <FormField
                            key={field.id}
                            control={form.control}
                            name={`learning_goals.${index}.value`}
                            render={({ field }) => (
                              <FormItem className="mb-3">
                                <div className="flex gap-2">
                                  <FormControl>
                                    <Input 
                                      {...field}
                                      id={`learning-goal-${index}`}
                                      name={`learning_goals.${index}.value`}
                                      placeholder="e.g., Learn technical analysis, Master risk management" 
                                      autoComplete="off"
                                      aria-label={`Learning goal ${index + 1}`}
                                    />
                                  </FormControl>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => removeGoal(index)}
                                    aria-label={`Remove learning goal ${index + 1}`}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => appendGoal({ value: "" })}
                          className="mt-2"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Learning Goal
                        </Button>
                      </div>

                      <FormField
                        control={form.control}
                        name="selected_path"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="student-learning-path">Preferred Learning Path</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                id="student-learning-path"
                                name="selected_path"
                                placeholder="e.g., Swing Trading, Day Trading, Long-term Investing" 
                                autoComplete="off"
                                aria-describedby="learning-path-description"
                              />
                            </FormControl>
                            <FormDescription id="learning-path-description">
                              What type of trading interests you most?
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </>
              )}
              
              <Button type="submit" disabled={isSaving} className="w-full">
                {isSaving ? "Saving..." : "Save changes"}
              </Button>

              {!profileComplete && (
                <p className="text-sm text-muted-foreground text-center">
                  Complete your profile to access all features
                </p>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Read-only display sections for system-managed data */}
      {fullProfileData?.role === 'coach' && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Coach Statistics</CardTitle>
            <CardDescription>Your coaching performance metrics (read-only)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Verification Status</Label>
                <div className="mt-1">
                  <Badge variant={fullProfileData.verification_status === 'verified' ? 'default' : 'secondary'}>
                    {fullProfileData.verification_status || 'pending'}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Rating</Label>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <p className="text-lg font-medium">{fullProfileData.rating || 0}/5</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Total Students</Label>
                <div className="flex items-center gap-1 mt-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p className="text-lg font-medium">{fullProfileData.total_students || 0}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Total Earnings</Label>
                <div className="flex items-center gap-1 mt-1">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <p className="text-lg font-medium">${fullProfileData.earnings || 0}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {fullProfileData?.role === 'student' && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Learning Progress</CardTitle>
            <CardDescription>Your learning achievements (read-only)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Tokens Earned</Label>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <p className="text-lg font-medium">{fullProfileData.tokens_earned || 0}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Courses Completed</Label>
                <div className="flex items-center gap-1 mt-1">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <p className="text-lg font-medium">{(fullProfileData.courses_completed || []).length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Avatar Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preview Profile Photo</DialogTitle>
            <DialogDescription>
              How would you like your new profile photo to look?
            </DialogDescription>
          </DialogHeader>
          {previewImage && (
            <div className="flex justify-center py-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={previewImage} alt="Profile photo preview" />
                <AvatarFallback>
                  {form.getValues("name")?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPreviewDialog(false);
                setPreviewImage(null);
                setSelectedFile(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmAvatarUpload}
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Update Photo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}