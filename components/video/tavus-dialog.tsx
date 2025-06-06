import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TavusRecorder } from './tavus-recorder';
import { createVideoTemplate } from '@/lib/tavus';
import { useToast } from '@/hooks/use-toast';

interface TavusDialogProps {
  onTemplateCreated?: (templateId: string) => void;
}

export function TavusDialog({ onTemplateCreated }: TavusDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'details' | 'record'>('details');
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    script: ''
  });
  const { toast } = useToast();

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const id = await createVideoTemplate(
        formData.name,
        formData.description,
        formData.script
      );
      setTemplateId(id);
      setStep('record');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create template",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordingComplete = () => {
    if (templateId) {
      onTemplateCreated?.(templateId);
      setIsOpen(false);
      toast({
        title: "Success",
        description: "Video template created successfully"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Create Video Template</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {step === 'details' ? (
          <>
            <DialogHeader>
              <DialogTitle>Create Video Template</DialogTitle>
              <DialogDescription>
                Set up your video template details. You'll record the video in the next step.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Welcome Message"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What this video template is for"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="script">Script</Label>
                <Textarea
                  id="script"
                  value={formData.script}
                  onChange={(e) => setFormData(prev => ({ ...prev, script: e.target.value }))}
                  placeholder="Write your script here..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? "Creating..." : "Next: Record Video"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Record Your Video</DialogTitle>
              <DialogDescription>
                Follow your script and record your video template
              </DialogDescription>
            </DialogHeader>
            {templateId && (
              <TavusRecorder
                templateId={templateId}
                onRecordingComplete={handleRecordingComplete}
              />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}