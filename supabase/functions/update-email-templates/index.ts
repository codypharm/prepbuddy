import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// This function is meant to be run once to update email templates
// It requires service role key to update email templates

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Update confirmation email template
    const { error: confirmationError } = await supabaseAdmin.auth.admin.updateTemplate({
      type: 'confirmation',
      template: `
        <h2>Confirm your email address</h2>
        <p>Follow this link to confirm your email address:</p>
        <p><a href="{{ .ConfirmationURL }}">Confirm your email address</a></p>
        <p>If you didn't create this account, you can ignore this email.</p>
        <p>Thanks,<br>PrepBuddy Team</p>
      `
    })

    if (confirmationError) {
      throw confirmationError
    }

    // Update reset password template
    const { error: resetError } = await supabaseAdmin.auth.admin.updateTemplate({
      type: 'recovery',
      template: `
        <h2>Reset your password</h2>
        <p>Follow this link to reset the password for your account:</p>
        <p><a href="{{ .SiteURL }}/reset-password#token={{ .Token }}">Reset your password</a></p>
        <p>If you didn't request a password reset, you can ignore this email.</p>
        <p>Thanks,<br>PrepBuddy Team</p>
      `
    })

    if (resetError) {
      throw resetError
    }

    // Update magic link template
    const { error: magicLinkError } = await supabaseAdmin.auth.admin.updateTemplate({
      type: 'magiclink',
      template: `
        <h2>Login to PrepBuddy</h2>
        <p>Follow this link to log in to your account:</p>
        <p><a href="{{ .SiteURL }}/auth/confirm?token={{ .Token }}">Log in to PrepBuddy</a></p>
        <p>If you didn't request this login, you can ignore this email.</p>
        <p>Thanks,<br>PrepBuddy Team</p>
      `
    })

    if (magicLinkError) {
      throw magicLinkError
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email templates updated successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error updating email templates:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})