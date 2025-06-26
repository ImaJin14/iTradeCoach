import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const { userId, newPlanId, currentPlanId } = await request.json();

    if (!userId || !newPlanId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log('Switching plan for user:', { userId, from: currentPlanId, to: newPlanId });

    // For Web Billing, plan switching requires cancelling current and creating new subscription
    // This will be handled in the frontend by first cancelling then purchasing new plan

    // Log the plan change request
    const { error: dbError } = await supabaseAdmin
      .from('subscription_changes')
      .insert({
        user_id: userId,
        from_plan: currentPlanId,
        to_plan: newPlanId,
        change_type: getPlanChangeType(currentPlanId, newPlanId),
        status: 'initiated',
        created_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Database error:', dbError);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Plan switch initiated',
      requiresCancellation: true // Indicates frontend should cancel current plan first
    });

  } catch (error) {
    console.error('Plan switch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getPlanChangeType(currentPlan: string | null, newPlan: string): string {
  if (!currentPlan) return 'new';
  
  // Simple price-based comparison
  const priceMap: Record<string, number> = {
    '$rc_monthly': 100,
    '$rc_annual': 80, // Monthly equivalent
    'student_monthly_package': 49,
    'student_yearly_package': 39,
    'coach_monthly_package': 99,
    'coach_yearly_package': 79,
  };

  const currentPrice = priceMap[currentPlan] || 0;
  const newPrice = priceMap[newPlan] || 0;

  if (newPrice > currentPrice) return 'upgrade';
  if (newPrice < currentPrice) return 'downgrade';
  return 'change';
}