import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
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
