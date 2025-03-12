export function parseSender(senderString) {
    const match = senderString.match(/"([^"]+)"\s*<([^>]+)>/);
    return match ? { name: match[1], email: match[2] } : { name: senderString, email: "" };
  }
  