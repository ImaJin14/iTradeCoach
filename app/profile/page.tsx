"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2, Upload, CheckCircle, AlertCircle } from "lucide-react";
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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  bio: z.string().max(500, { message: "Bio must be less than 500 characters" }),
  website: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
  role: z.enum(["student", "coach"], {
    required_error: "Please select your role",
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface UserProfile {
  bio: string | null;
  website: string | null;
  twitter: string | null;
  linkedin: string | null;
  avatar_url: string | null;
  profile_complete: boolean;
}

interface ProfileData {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  subscription_status: string | null;
  user_profiles: UserProfile[];
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
      role: "student",
    },
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

        // Get profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, email, role, subscription_status')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // Get user profile data
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
          // Get name from OAuth metadata if not set
          if (!initialName) {
            initialName = user.user_metadata?.full_name || 
                         user.user_metadata?.name || 
                         user.user_metadata?.display_name || 
                         "";
          }
          
          // Get avatar from OAuth if not set
          if (!initialAvatarUrl) {
            initialAvatarUrl = user.user_metadata?.avatar_url || 
                              user.user_metadata?.picture || 
                              null;
          }
        }

        setAvatarUrl(initialAvatarUrl ?? null);
        
        // Reset form with the correct data
        form.reset({
          name: initialName || "",
          bio: userProfileData?.bio || "",
          website: userProfileData?.website || "",
          twitter: userProfileData?.twitter || "",
          linkedin: userProfileData?.linkedin || "",
          role: (profileData?.role as "student" | "coach") || "student",
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
      if (userError || !user) throw new Error('Not authenticated');

      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, selectedFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

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

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast({
        title: "Success",
        description: "Profile photo updated successfully",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to upload profile photo. Please try again.",
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

      // Update name and role in profiles table
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          role: data.role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileUpdateError) throw profileUpdateError;

      // Update profile details in user_profiles table (upsert for OAuth users who might not have a record)
      const { error: userProfileUpdateError } = await supabase
        .from('user_profiles')
        .upsert({
          prof_id: user.id,
          bio: data.bio,
          website: data.website,
          twitter: data.twitter,
          linkedin: data.linkedin,
          profile_complete: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'prof_id'
        });

      if (userProfileUpdateError) throw userProfileUpdateError;

      // For OAuth users, also update their auth metadata
      if (isOAuthUser) {
        const { error: authUpdateError } = await supabase.auth.updateUser({
          data: {
            role: data.role,
            profile_complete: true,
          }
        });

        if (authUpdateError) {
          console.warn('Failed to update auth metadata:', authUpdateError);
          // Don't throw error as main profile update succeeded
        }
      }

      setProfileComplete(true);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
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
          <div className="mb-8 flex flex-col items-center">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl || undefined} alt="Profile" />
                <AvatarFallback>
                  {form.getValues("name")?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2">
                <label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="rounded-full bg-primary p-2 text-primary-foreground shadow-sm hover:bg-primary/90">
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </div>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isUploading}
                  />
                </label>
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

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="student">Student - Learn Trading</SelectItem>
                        <SelectItem value="coach">Coach - Teach Trading</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {isOAuthUser && !profileComplete && 
                        "Please select your role to complete your profile setup"
                      }
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
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us about yourself..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Write a brief bio about your trading experience and expertise
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
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://your-website.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="twitter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Twitter</FormLabel>
                    <FormControl>
                      <Input placeholder="@username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn</FormLabel>
                    <FormControl>
                      <Input placeholder="Your LinkedIn profile URL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
                <AvatarImage src={previewImage} />
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