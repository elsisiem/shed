import { AgentMailClient } from "agentmail";
import { env } from "./env.ts";

export async function sendReceipt(opts: {
  dropped: number;
  savedTokens: number;
  savedUsd: number;
  generation: number;
}): Promise<{ messageId: string; to: string } | { skipped: string }> {
  if (!env.agentmailKey || !env.agentmailInbox) return { skipped: "no AgentMail key" };
  const to = env.moltNotifyTo || env.agentmailInbox;
  const client = new AgentMailClient({ apiKey: env.agentmailKey });
  const sent = await client.inboxes.messages.send(env.agentmailInbox, {
    to,
    subject: `Shed gen ${opts.generation}: dropped ${opts.dropped} organs`,
    text: `Your harness molted to generation ${opts.generation}.\n\nDropped: ${opts.dropped} unused organs\nTokens no longer billed every run: ${opts.savedTokens}\n~$ ${opts.savedUsd.toFixed(6)} per run at $3/MTok\n\nSame task. Thinner coat.\nRook`,
  });
  return { messageId: sent.messageId, to };
}
