'use server';

import { Resend } from 'resend';
import { z } from 'zod';

const resend = new Resend(process.env.RESEND_API_KEY);

const ContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional(),
  phone: z.string().optional(),
  message: z.string().min(1),
});

export type ContactFormData = z.infer<typeof ContactSchema>;

export async function sendEmail(data: ContactFormData) {
  const result = ContactSchema.safeParse(data);

  if (!result.success) {
    return { success: false, error: 'Invalid input' };
  }

  const { name, email, company, phone, message } = result.data;

  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY is missing. Email data:', data);
      // For development without key, we might want to return false to prompt user
      return { success: false, error: 'Server configuration error: Missing API Key' };
    }

    await resend.emails.send({
      from: 'Fashion Export Website <onboarding@resend.dev>',
      to: 'fzbn168@gmail.com', // Using user's email
      subject: `New Inquiry from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company:</strong> ${company || 'N/A'}</p>
        <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
        <hr />
        <h3>Message:</h3>
        <p style="white-space: pre-wrap;">${message}</p>
      `,
      reply_to: email,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: 'Failed to send email. Please try again later.' };
  }
}
