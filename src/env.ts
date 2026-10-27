export const env = {
  port: Number(process.env.PORT ?? 8080),
  exaKey: process.env.EXA_API_KEY ?? "",
  mongoUri: process.env.MONGODB_URI ?? "",
  agentmailKey: process.env.AGENTMAIL_API_KEY ?? "",
  agentmailInbox: process.env.AGENTMAIL_INBOX ?? "",
  moltNotifyTo: process.env.MOLT_NOTIFY_TO ?? "",
  raindropKey: process.env.RAINDROP_WRITE_KEY ?? "",
  raindropProject: process.env.RAINDROP_PROJECT ?? "shed",
  elevenKey: process.env.ELEVENLABS_API_KEY ?? "",
  elevenVoice: process.env.ELEVENLABS_VOICE_ID ?? "",
};
