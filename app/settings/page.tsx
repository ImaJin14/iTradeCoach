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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const settingsFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    marketing: z.boolean(),
  }),
  timezone: z.string(),
  language: z.string(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

// Type for notifications from database
interface NotificationSettings {
  email?: boolean;
  push?: boolean;
  marketing?: boolean;
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      email: "",
      notifications: {
        email: true,
        push: true,
        marketing: false,
      },
      timezone: "UTC",
      language: "en",
    },
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          router.push('/sign-in');
          return;
        }

        // Get user settings using the correct primary key (id)
        const { data: settings, error: settingsError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (settingsError) {
          console.error('Settings error:', settingsError);
          throw settingsError;
        }

        // Get user profile for email
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Profile error:', profileError);
          throw profileError;
        }

        // Type-safe handling of notifications JSON
        const defaultNotifications = {
          email: true,
          push: true,
          marketing: false,
        };

        let notifications = defaultNotifications;
        
        if (settings?.notifications) {
          try {
            // Handle both object and string formats
            const notificationData = typeof settings.notifications === 'string' 
              ? JSON.parse(settings.notifications) 
              : settings.notifications;
            
            // Validate and merge with defaults
            notifications = {
              email: typeof notificationData?.email === 'boolean' ? notificationData.email : defaultNotifications.email,
              push: typeof notificationData?.push === 'boolean' ? notificationData.push : defaultNotifications.push,
              marketing: typeof notificationData?.marketing === 'boolean' ? notificationData.marketing : defaultNotifications.marketing,
            };
          } catch (error) {
            console.warn('Failed to parse notifications, using defaults:', error);
            notifications = defaultNotifications;
          }
        }

        form.reset({
          email: profile?.email || user.email || "",
          notifications: notifications,
          timezone: settings?.timezone || "UTC",
          language: settings?.language || "en",
        });
      } catch (error) {
        console.error('Error loading settings:', error);
        toast({
          title: "Error",
          description: "Failed to load settings. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, [form, router, toast]);

  async function onSubmit(data: SettingsFormValues) {
    setIsSaving(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Not authenticated');
      }

      // Update user_settings with correct column mapping
      const { error: updateError } = await supabase
        .from('user_settings')
        .upsert({
          id: user.id, // Primary key should be user.id
          prof_id: user.id, // Foreign key to user_profiles
          notifications: data.notifications, // This will be properly serialized as JSON
          timezone: data.timezone,
          language: data.language,
          updated_at: new Date().toISOString(),
        });

      if (updateError) {
        console.error('Settings update error:', updateError);
        throw updateError;
      }

      // Update email in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          email: data.email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }

      // Update auth email if it changed
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      if (currentProfile?.email !== data.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: data.email,
        });

        if (emailError) {
          console.error('Auth email update error:', emailError);
          // Don't throw here as the profile was already updated
          toast({
            title: "Settings updated",
            description: "Settings saved. You may need to verify your new email address.",
          });
          return;
        }
      }

      toast({
        title: "Settings updated",
        description: "Your settings have been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
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
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Manage your account settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Account Settings</h3>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        This is the email used for your account
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notifications</h3>
                <FormField
                  control={form.control}
                  name="notifications.email"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Email Notifications</FormLabel>
                        <FormDescription>
                          Receive email notifications about your sessions and updates
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notifications.push"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Push Notifications</FormLabel>
                        <FormDescription>
                          Receive push notifications for important updates
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notifications.marketing"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Marketing Emails</FormLabel>
                        <FormDescription>
                          Receive emails about new features and promotions
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Preferences</h3>
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., America/New_York" />
                      </FormControl>
                      <FormDescription>
                        Your preferred timezone for scheduling sessions
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., en, fr, es" />
                      </FormControl>
                      <FormDescription>
                        Your preferred language for the platform
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}