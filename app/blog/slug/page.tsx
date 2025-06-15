import { supabase } from "@/lib/supabase";
import BlogPostContent from "@/components/BlogPostContent";

// Generate static params for all blog posts
export async function generateStaticParams() {
  try {
    // Fetch all published blog post slugs from your database
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('slug')
      .eq('status', 'published'); // Only generate for published posts

    if (error) {
      console.error('Error fetching posts for static generation:', error);
      return [];
    }

    // Return array of params objects
    return posts?.map((post) => ({
      slug: post.slug,
    })) || [];
  } catch (error) {
    console.error('Error in generateStaticParams:', error);
    return [];
  }
}

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  
  return <BlogPostContent slug={slug} />;
}