process.env.NODE_ENV = 'test';

// Provide test defaults so OAuth strategy bootstrap does not emit missing-credential warnings.
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'test-google-client-secret';
process.env.GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'test-github-client-id';
process.env.GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || 'test-github-client-secret';
process.env.GITLAB_CLIENT_ID = process.env.GITLAB_CLIENT_ID || 'test-gitlab-client-id';
process.env.GITLAB_CLIENT_SECRET = process.env.GITLAB_CLIENT_SECRET || 'test-gitlab-client-secret';
process.env.DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || 'test-discord-client-id';
process.env.DISCORD_CLIENT_SECRET =
  process.env.DISCORD_CLIENT_SECRET || 'test-discord-client-secret';
process.env.LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || 'test-linkedin-client-id';
process.env.LINKEDIN_CLIENT_SECRET =
  process.env.LINKEDIN_CLIENT_SECRET || 'test-linkedin-client-secret';
