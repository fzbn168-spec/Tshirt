# Deployment Guide for Fashion Export Website

This project is built with Next.js 16. The recommended deployment method is using Vercel, but it can also be hosted on any server that supports Node.js.

## Environment Variables

This project requires the following environment variables to be set in your deployment environment (Vercel, .env file, etc.):

- `RESEND_API_KEY`: Your Resend API Key for sending emails. Get it at [resend.com](https://resend.com).
- `NEXT_PUBLIC_BASE_URL`: (Optional) The public URL of your website (e.g., `https://your-domain.com`) for SEO.

## Option 1: Vercel (Recommended)

The easiest way to deploy is to use the [Vercel Platform](https://vercel.com/new).

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket).
2. Import the project into Vercel.
3. **Add Environment Variables**: In the Vercel project settings, add `RESEND_API_KEY` and `NEXT_PUBLIC_BASE_URL`.
4. Vercel will automatically detect Next.js and configure the build settings.
5. Click **Deploy**.

## Option 2: Self-Hosted (Node.js Server)

You can host this application on any VPS (like AWS EC2, DigitalOcean, Aliyun) or local server.

### Prerequisites
- Node.js 18.17 or later installed on the server.

### Steps

1. **Build the application**:
   Run the build command locally or on the server:
   ```bash
   npm run build
   ```

2. **Start the server**:
   ```bash
   npm run start
   ```
   By default, it runs on port 3000. You can specify a port:
   ```bash
   npm run start -- -p 80
   ```

3. **Process Management (PM2)**:
   For production, it's recommended to use a process manager like PM2 to keep the site running.
   ```bash
   npm install -g pm2
   pm2 start npm --name "fashion-web" -- start
   ```

## Option 3: Docker

1. Build the Docker image:
   ```bash
   docker build -t fashion-web .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 fashion-web
   ```
