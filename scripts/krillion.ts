import { createKrillionClient, KrillionApiError } from "../src/krillion/client.ts";

const [command, ...args] = process.argv.slice(2);
const client = createKrillionClient();

try {
  if (command === "today" && args.length === 0) {
    console.log(JSON.stringify(await client.getToday(), null, 2));
  } else if (
    command === "submit" &&
    (args.length === 4 || (args.length === 5 && args[4] === "--no-preview"))
  ) {
    const [date, promptId, answer, playerId] = args;
    console.log(
      JSON.stringify(
        await client.submit({
          date,
          promptId,
          answer,
          playerId,
          previewCorrection: args[4] !== "--no-preview",
        }),
        null,
        2,
      ),
    );
  } else {
    console.error(
      'Usage: npm run krillion -- today\n       npm run krillion -- submit DATE PROMPT_ID "ANSWER" PLAYER_ID [--no-preview]',
    );
    process.exitCode = 2;
  }
} catch (error) {
  if (error instanceof KrillionApiError) {
    console.error(
      JSON.stringify({ reason: error.reason, status: error.status, message: error.message }),
    );
  } else {
    console.error("Unexpected Krillion client failure");
  }
  process.exitCode = 1;
}
