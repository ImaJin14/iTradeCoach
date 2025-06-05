import { supabase } from './supabase';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  votes: number;
  createdAt: Date;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  participants: number;
  prize: string;
}

export async function scheduleWeeklyPosts() {
  try {
    // Schedule posts for different challenges
    const challenges = [
      {
        subreddit: 'trading',
        title: 'My Worst Trade Ever Tournament - Weekly Thread',
        content: 'Share your biggest trading mishap and the lessons learned!'
      },
      {
        subreddit: 'cryptocurrency',
        title: 'Fake Guru Bingo - Spot the Scammer',
        content: 'Help protect the community by identifying common trading scams.'
      },
      {
        subreddit: 'forex',
        title: 'Trading Strategy Mad Libs',
        content: 'Create hilarious (but educational) trading strategies!'
      }
    ];

    // Store scheduled posts in database
    const { error } = await supabase
      .from('scheduled_posts')
      .insert(challenges);

    if (error) throw error;

    return { success: true, message: 'Posts scheduled successfully' };
  } catch (error) {
    console.error('Error scheduling posts:', error);
    return { success: false, message: error.message };
  }
}

export async function trackUserEngagement(userId: string, activityType: string) {
  try {
    const { error } = await supabase
      .from('user_engagement')
      .insert({
        user_id: userId,
        activity_type: activityType,
        timestamp: new Date()
      });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error tracking engagement:', error);
    return { success: false, error: error.message };
  }
}

export async function generateAIMemes(content: string) {
  // This is a placeholder for AI meme generation
  // In production, this would integrate with an AI service
  return {
    success: true,
    memeUrl: 'https://example.com/generated-meme.jpg'
  };
}

export async function manageVotingSystem(postId: string, userId: string, voteType: 'up' | 'down') {
  try {
    const { data: existingVote, error: fetchError } = await supabase
      .from('votes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    if (existingVote) {
      // Update existing vote
      const { error } = await supabase
        .from('votes')
        .update({ vote_type: voteType })
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // Create new vote
      const { error } = await supabase
        .from('votes')
        .insert({
          post_id: postId,
          user_id: userId,
          vote_type: voteType
        });

      if (error) throw error;
    }

    // Update post score
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('vote_type')
      .eq('post_id', postId);

    if (votesError) throw votesError;

    const score = votes.reduce((acc, vote) => 
      acc + (vote.vote_type === 'up' ? 1 : -1), 0);

    const { error: updateError } = await supabase
      .from('posts')
      .update({ score })
      .eq('id', postId);

    if (updateError) throw updateError;

    return { success: true, score };
  } catch (error) {
    console.error('Error managing vote:', error);
    return { success: false, error: error.message };
  }
}

export async function updateLeaderboards() {
  try {
    // Get top contributors
    const { data: topContributors, error: contributorsError } = await supabase
      .from('user_engagement')
      .select('user_id, count(*)')
      .group('user_id')
      .order('count', { ascending: false })
      .limit(10);

    if (contributorsError) throw contributorsError;

    // Get top voted posts
    const { data: topPosts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .order('score', { ascending: false })
      .limit(10);

    if (postsError) throw postsError;

    // Update leaderboards table
    const { error: updateError } = await supabase
      .from('leaderboards')
      .upsert({
        id: 'weekly',
        top_contributors: topContributors,
        top_posts: topPosts,
        updated_at: new Date()
      });

    if (updateError) throw updateError;

    return { success: true, topContributors, topPosts };
  } catch (error) {
    console.error('Error updating leaderboards:', error);
    return { success: false, error: error.message };
  }
}

export async function createCustomFlairs(userId: string, flairType: string) {
  try {
    const { error } = await supabase
      .from('user_flairs')
      .insert({
        user_id: userId,
        flair_type: flairType,
        created_at: new Date()
      });

    if (error) throw error;

    return { success: true, message: 'Flair created successfully' };
  } catch (error) {
    console.error('Error creating flair:', error);
    return { success: false, error: error.message };
  }
}