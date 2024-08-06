const HelpScout = require("helpscout-mailbox-api");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// Add this sleep function at the top of the file
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const clientId = process.env.HELPSCOUT_APP_ID;
const clientSecret = process.env.HELPSCOUT_APP_SECRET;

// Initialize HelpScout client
const helpscout = new HelpScout({
  clientId,
  clientSecret,
  authenticationFlow: "clientCredentials",
});

async function exportHelpScoutData() {
  try {
    // Authenticate and get the access token
    const tokens = await helpscout.getTokens();
    helpscout.setCredentials(tokens);

    // List all mailboxes
    await sleep(100);
    const mailboxesResponse = await helpscout.mailboxes.list();
    if (
      !mailboxesResponse ||
      !mailboxesResponse.data ||
      !mailboxesResponse.data._embedded ||
      !mailboxesResponse.data._embedded.mailboxes
    ) {
      throw new Error("Unexpected mailboxes response structure");
    }

    const mailboxes = mailboxesResponse.data._embedded.mailboxes;

    for (const mailbox of mailboxes) {

      let page = 1;

      // Since the script will get interrupted if your machine loses network access
      // let page = 61;

      // If the script gets interrupted, you'll want to skip exporting any mailboxes you've completed
      // if (mailbox.name === "Spruce Sales" || mailbox.name === "Spruce Support" || mailbox.name === "Number Ports") {
      //   continue;
      // }

      const mailboxDir = path.join(__dirname, "mailbox-exports", mailbox.name);
      await fs.ensureDir(mailboxDir);

      // List conversations in the mailbox
      console.log(
        `Fetching conversations for mailbox: ${mailbox.name} (ID: ${mailbox.id})`
      );

      let hasMoreConversations = true;

      while (hasMoreConversations) {
        await sleep(100);
        const timestamp = new Date().toISOString();
        console.log(
          `[${timestamp}] Fetching page ${page} for mailbox: ${mailbox.name}`
        );
        const conversationsResponse = await helpscout.conversations.list({
          mailbox: mailbox.id,
          page,
          status: "all",
        });

        if (
          !conversationsResponse ||
          !conversationsResponse.data ||
          !conversationsResponse.data._embedded ||
          !conversationsResponse.data._embedded.conversations
        ) {
          console.warn(
            `No conversations found for mailbox ${mailbox.name} on page ${page}`
          );
          break;
        }

        const conversations =
          conversationsResponse.data._embedded.conversations;

        for (const conversation of conversations) {
          const conversationDir = path.join(
            mailboxDir,
            `conversation_${conversation.id}`
          );
          if (await fs.pathExists(conversationDir)) {
            console.log(`Skipping existing conversation: ${conversation.id}`);
            continue;
          }
          await fs.ensureDir(conversationDir);

          // Save conversation details to a JSON file
          await fs.writeJson(
            path.join(conversationDir, "conversation.json"),
            conversation,
            { spaces: 2 }
          );

          // List threads in the conversation
          console.log(`Fetching threads for conversation: ${conversation.id}`);
          await sleep(100);
          const threadsResponse = await helpscout.conversations.threads.list(
            conversation.id
          );

          if (
            !threadsResponse ||
            !threadsResponse.data ||
            !threadsResponse.data._embedded ||
            !threadsResponse.data._embedded.threads
          ) {
            console.warn(
              `No threads found for conversation ${conversation.id}`
            );
            continue;
          }

          const threads = threadsResponse.data._embedded.threads;

          for (const thread of threads) {
            // Save thread details to a JSON file
            await fs.writeJson(
              path.join(conversationDir, `thread_${thread.id}.json`),
              thread,
              { spaces: 2 }
            );

            // Download and save attachments
            if (
              thread._embedded &&
              thread._embedded.attachments &&
              thread._embedded.attachments.length > 0
            ) {
              for (const attachment of thread._embedded.attachments) {
                try {
                  await sleep(100);
                  const attachmentResponse =
                    await helpscout.conversations.attachments.getData(
                      conversation.id,
                      attachment.id
                    );

                  let attachmentData = attachmentResponse.data.data;
                  if (!attachmentData) {
                    throw new Error(
                      "Attachment data is empty or in an unexpected format"
                    );
                  }

                  // The data is likely base64 encoded, so we need to decode it
                  const buffer = Buffer.from(attachmentData, "base64");

                  const attachmentPath = path.join(
                    conversationDir,
                    attachment.filename
                  );
                  await fs.writeFile(attachmentPath, buffer);
                  console.log(
                    `Successfully downloaded attachment: ${attachment.filename}`
                  );
                } catch (attachmentError) {
                  console.error(
                    `Failed to download attachment ${attachment.id} for thread ${thread.id}: ${attachmentError.message}`
                  );

                  // Create an error text file instead of the attachment
                  const errorFileName = `ERROR_${attachment.id}_${attachment.filename}.txt`;
                  const errorFilePath = path.join(
                    conversationDir,
                    errorFileName
                  );
                  const errorMessage = `Failed to download attachment ${attachment.id}: ${attachmentError.message}`;
                  await fs.writeFile(errorFilePath, errorMessage);
                  console.log(
                    `Created error file for attachment: ${errorFileName}`
                  );
                }
              }
            }

            await sleep(100);
          }
        }

        // Check if there are more pages
        const pageInfo = conversationsResponse.data.page;
        hasMoreConversations = pageInfo.number < pageInfo.totalPages;
        page = pageInfo.number + 1;
      }
    }
    console.log("Export completed successfully.");
  } catch (error) {
    console.error("Error exporting data:", error);
    if (error.response) {
      console.error(
        "API response:",
        JSON.stringify(error.response.data, null, 2)
      );
    }
  }
}

exportHelpScoutData();
