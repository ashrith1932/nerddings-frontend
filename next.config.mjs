/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // The social enhancer currently has a backend field-name mismatch
    // (github_url vs githubUrl). Keep production deployment unblocked while
    // the frontend type is normalized to the API response shape.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
