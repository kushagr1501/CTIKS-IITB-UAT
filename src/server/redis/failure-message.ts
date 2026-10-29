// Redis errors can contain connection URLs, commands, and credentials. Only
// return messages known not to contain user data or connection details.
export function safeRedisFailureMessage(error: unknown): string {
  if (!(error instanceof Error)) return '[error message redacted]';
  const message = error.message;
  const safeMessages = new Set([
    'Connection is closed.',
    'Redis transaction aborted.',
    'Command timed out',
    'Connection timed out',
    'Reached the max retries per request limit',
  ]);
  if (safeMessages.has(message)) return message;
  const socketError = message.match(/^(connect|read|write) (ECONNREFUSED|ECONNRESET|ETIMEDOUT|EPIPE)(?:\s|$)/);
  if (socketError) return `${socketError[1]} ${socketError[2]} [details redacted]`;
  return '[error message redacted]';
}
