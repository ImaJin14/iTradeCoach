import { supabase } from "@/lib/supabase";
import EditBlogPostForm from "@/components/EditBlogPostForm";

// Generate static params for all blog posts
export async function generateStaticParams() {
  try {
    // Fetch all blog post IDs from your database
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('id');

    if (error) {
      console.error('Error fetching posts for static generation:', error);
      return [];
    }

    // Return array of params objects
    return posts?.map((post) => ({
      id: post.id,
    })) || [];
  } catch (error) {
    console.error('Error in generateStaticParams:', error);
    return [];
  }
}

interface EditBlogPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBlogPostPage({ params }: EditBlogPostPageProps) {
  const { id } = await params;
  
  return <EditBlogPostForm postId={id} />;
}