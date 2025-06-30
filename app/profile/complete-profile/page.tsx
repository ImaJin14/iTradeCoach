"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LineChart, CheckCircle } from "lucide-react";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  role: z.enum(["student", "coach", "admin"], {
    required_error: "Please select your role",
  }),
  bio: z.string().max(500, { message: "Bio must be less than 500 characters" }).optional(),
});

type FormValues = z.infer<typeof formSchema>;

function CompleteProfileForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [oauthData, setOauthData] = useState<any>(null);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFromOAuth = searchParams?.get('from') === 'oauth';
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      role: "student",
      bio: "",
    },
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/sign-in');
        return;
      }
      
      setUser(user);
      
      // Check if profile is already complete
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('profile_complete')
        .eq('prof_id', user.id)
        .single();

      if (userProfile?.profile_complete) {
        router.replace('/dashboard');
        return;
      }
      
      // If OAuth user, pre-populate with OAuth data
      if (user.app_metadata.provider !== 'email') {
        const oauthMetadata = {
          name: user.user_metadata?.full_name || 
                user.user_metadata?.name || 
                user.user_metadata?.display_name || "",
          avatar: user.user_metadata?.avatar_url || 
                  user.user_metadata?.picture || null,
          email: user.email,
          provider: user.app_metadata.provider
        };
        
        setOauthData(oauthMetadata);
        
        // Pre-populate form with OAuth data
        form.setValue('name', oauthMetadata.name);
      }
    };
    getUser();
  }, [router, form]);

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    
    try {
      if (!user) throw new Error('User not found');

      // Create/update profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: data.name,
          email: user.email,
          role: data.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (profileError) throw profileError;

      // Create/update user profile
      const { error: userProfileError } = await supabase
        .from('user_profiles')
        .upsert({
          prof_id: user.id,
          bio: data.bio || '',
          avatar_url: oauthData?.avatar || null,
          profile_complete: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'prof_id'
        });

      if (userProfileError) throw userProfileError;

      // Create role-specific profile
      if (data.role === 'coach') {
        const { error: coachProfileError } = await supabase
          .from('coach_profiles')
          .upsert({
            coach_id: user.id,
            hourly_rate: 0,
            expertise_areas: [],
            verification_status: 'pending',
            rating: 0,
            total_students: 0,
            earnings: 0,
            subscription_active: false,
            subscription_required: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'coach_id'
          });

        if (coachProfileError) throw coachProfileError;
      } else if (data.role === 'student') {
        const { error: studentProfileError } = await supabase
          .from('student_profiles')
          .upsert({
            student_id: user.id,
            current_level: 'beginner',
            tokens_earned: 0,
            courses_completed: [],
            learning_goals: [],
            subscription_required: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'student_id'
          });

        if (studentProfileError) throw studentProfileError;
      } else if (data.role === 'admin') {
        const { error: adminProfileError } = await (supabase as any)
          .from('admin_profiles')
          .upsert({
            admin_id: user.id,
            permissions: ['read', 'write', 'delete', 'manage_users', 'manage_content'],
            access_level: 'full',
            department: 'general',
            last_login: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'admin_id'
          });

        if (adminProfileError) throw adminProfileError;
      }

      // Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          role: data.role,
          profile_complete: true,
        }
      });

      if (authError) {
        console.warn('Failed to update auth metadata:', authError);
      }

      toast({
        title: "Profile completed!",
        description: "Welcome to iTradeCoach. Your profile has been set up successfully.",
      });

      // Debug logging
      console.log("Profile completion - User role:", data.role);
      console.log("Profile completion - User ID:", user.id);
      
      // Verify the user_profiles record was created
      const { data: verifyProfile, error: verifyError } = await supabase
        .from('user_profiles')
        .select('profile_complete')
        .eq('prof_id', user.id)
        .single();
      
      if (verifyError) {
        console.error("Failed to verify user profile:", verifyError);
      } else {
        console.log("User profile verification:", verifyProfile);
      }
      
      // All users go to main dashboard (admin rendering is handled there)
      console.log("Redirecting all users to /dashboard");
      router.replace("/dashboard");
    } catch (error: any) {
      console.error("Profile completion error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!user) {
    return <div>Loading...</div>;
  }

  const isOAuthUser = user.app_metadata.provider !== 'email';

  return (
    <div className="container flex h-screen flex-col items-center justify-center">
      <Link href="/" className="absolute left-4 top-4 md:left-8 md:top-8 flex items-center">
        <LineChart className="h-6 w-6 mr-2" />
        <span className="font-bold">iTradeCoach</span>
      </Link>
      
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            Complete your profile
            {isFromOAuth && (
              <Badge variant="secondary" className="text-xs">
                {oauthData?.provider}
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-center">
            {isOAuthUser ? (
              <>Welcome! We've imported some info from your {oauthData?.provider} account. Please complete your profile.</>
            ) : (
              <>Welcome {user.user_metadata?.full_name || user.email}! Please tell us what you'd like to do.</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isOAuthUser && oauthData?.avatar && (
            <div className="flex justify-center mb-6">
              <Avatar className="h-16 w-16">
                <AvatarImage src={oauthData.avatar} alt="Profile" />
                <AvatarFallback>
                  {form.getValues("name")?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} />
                    </FormControl>
                    {isOAuthUser && (
                      <FormDescription className="text-xs">
                        Imported from {oauthData?.provider}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I want to...</FormLabel>
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
                        <SelectItem value="student">Learn trading (Student)</SelectItem>
                        <SelectItem value="coach">Teach trading (Coach)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us about yourself..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Briefly describe your trading experience
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Setting up..." : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Complete Profile & Continue
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CompleteProfile() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CompleteProfileForm />
    </Suspense>
  );
}