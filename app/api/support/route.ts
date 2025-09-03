import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message, markerKey, videoKey, userId } = await request.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Build public URLs if configured
    const publicBase = process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL
    const markerUrl = publicBase && markerKey ? `${publicBase.replace(/\/$/, '')}/${markerKey}` : null
    const videoUrl = publicBase && videoKey ? `${publicBase.replace(/\/$/, '')}/${videoKey}` : null

    // Persist to Supabase (best-effort)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (supabaseUrl && serviceRole) {
      try {
        const supabase = createClient(supabaseUrl, serviceRole)
        const { error: insertErr } = await supabase
          .from('leads')
          .insert({
            name,
            email,
            subject,
            message,
            user_id: userId || null,
            marker_key: markerKey || null,
            video_key: videoKey || null,
            marker_url: markerUrl,
            video_url: videoUrl,
          })
        if (insertErr) {
          console.error('❌ Failed to insert lead into Supabase:', insertErr)
        } else {
          console.log('✅ Lead stored in Supabase')
        }

        // Best-effort: create a draft ar_experiences row
        try {
          if (userId) {
            const { error: arErr } = await supabase
              .from('ar_experiences')
              .insert({
                user_id: userId,
                title: 'Draft from lead',
                description: message?.slice(0, 500) || null,
                marker_image_url: markerUrl || markerKey || 'pending',
                mind_file_url: 'pending',
                video_url: videoUrl || videoKey || 'pending',
                preview_image_url: null,
                plane_width: 1,
                plane_height: 1,
                video_rotation: 0,
              })
            if (arErr) console.error('❌ Failed to create draft ar_experiences:', arErr)
            else console.log('✅ Draft ar_experiences created')
          }
        } catch (arCatch) {
          console.error('❌ ar_experiences insert exception:', arCatch)
        }
      } catch (dbErr) {
        console.error('❌ Supabase client error:', dbErr)
      }
    } else {
      console.warn('⚠️ Supabase URL or Service Role key not configured. Skipping DB insert.')
    }

    // Create email content
    const emailContent = {
      to: 'manish@quickscanar.com',
      from: 'noreply@quickscanar.com',
      subject: `[QuickScanAR Support] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Support Request</h2>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>From:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h3 style="margin-top: 0;">Message:</h3>
            <p style="white-space: pre-wrap;">${message}</p>
            <hr/>
            <p><strong>User ID:</strong> ${userId || 'N/A'}</p>
            <p><strong>Marker Key:</strong> ${markerKey || 'N/A'}</p>
            <p><strong>Video Key:</strong> ${videoKey || 'N/A'}</p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              <strong>Reply to:</strong> ${email}
            </p>
          </div>
        </div>
      `,
      text: `
New Support Request from QuickScanAR

From: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

User ID: ${userId || 'N/A'}
Marker Key: ${markerKey || 'N/A'}
Video Key: ${videoKey || 'N/A'}

Marker URL: ${markerUrl || 'N/A'}
Video URL: ${videoUrl || 'N/A'}

Reply to: ${email}
      `
    };

    // Use Resend API to send email (you'll need to add RESEND_API_KEY to your env)
    if (process.env.RESEND_API_KEY) {
      try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'QuickScanAR Support <noreply@quickscanar.com>',
            to: ['manish@quickscanar.com'],
            subject: `[QuickScanAR Support] ${subject}`,
            html: emailContent.html,
            reply_to: email
          }),
        });

        if (resendResponse.ok) {
          console.log('✅ Support email sent successfully');
          return NextResponse.json({ 
            success: true, 
            message: 'Support request sent successfully. We will respond within 24 hours.' 
          });
        } else {
          console.error('❌ Failed to send email via Resend:', await resendResponse.text());
        }
      } catch (error) {
        console.error('❌ Resend API error:', error);
      }
    }

    // Fallback: Log the email content and return success
    console.log('📧 Support email logged (no email service configured):', emailContent);
    return NextResponse.json({ 
      success: true, 
      message: 'Support request received. We will respond within 24 hours.' 
    });

  } catch (error) {
    console.error('Error processing support request:', error);
    return NextResponse.json(
      { error: 'Failed to send support request' },
      { status: 500 }
    );
  }
}
