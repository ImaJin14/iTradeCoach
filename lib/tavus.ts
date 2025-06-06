import { Tavus } from '@tavus/js';

// Initialize Tavus client
const tavus = new Tavus(process.env.NEXT_PUBLIC_TAVUS_API_KEY!);

// Types for video responses
export interface VideoResponse {
  id: string;
  url: string;
  status: 'processing' | 'ready' | 'failed';
  createdAt: string;
}

// Function to create a personalized video
export async function createPersonalizedVideo(
  templateId: string,
  variables: Record<string, string>
): Promise<VideoResponse> {
  try {
    const response = await tavus.videos.create({
      templateId,
      variables
    });

    return {
      id: response.id,
      url: response.url,
      status: response.status,
      createdAt: response.createdAt
    };
  } catch (error) {
    console.error('Error creating personalized video:', error);
    throw error;
  }
}

// Function to get video status
export async function getVideoStatus(videoId: string): Promise<VideoResponse> {
  try {
    const response = await tavus.videos.get(videoId);
    
    return {
      id: response.id,
      url: response.url,
      status: response.status,
      createdAt: response.createdAt
    };
  } catch (error) {
    console.error('Error getting video status:', error);
    throw error;
  }
}

// Function to create a video template
export async function createVideoTemplate(
  name: string,
  description: string,
  script: string
): Promise<string> {
  try {
    const response = await tavus.templates.create({
      name,
      description,
      script
    });

    return response.id;
  } catch (error) {
    console.error('Error creating video template:', error);
    throw error;
  }
}

// Function to record a video for template
export async function recordTemplateVideo(templateId: string): Promise<void> {
  try {
    await tavus.recording.start({
      templateId,
      webcam: true,
      audio: true
    });
  } catch (error) {
    console.error('Error starting recording:', error);
    throw error;
  }
}

// Function to stop recording
export async function stopRecording(): Promise<void> {
  try {
    await tavus.recording.stop();
  } catch (error) {
    console.error('Error stopping recording:', error);
    throw error;
  }
}