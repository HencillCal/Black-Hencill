const welcomegoodbye = process.env.WELCOMEGOODBYE || 'FALSE'; 
const botname = process.env.BOTNAME || 'Black-Demon🐈‍⬛🖤';

const Events = async (client, Nick) => {
    if (!Nick?.id || !Array.isArray(Nick.participants)) return;

    let metadata;
    try {
        metadata = await client.groupMetadata(Nick.id);
    } catch (err) {
        const statusCode = err?.output?.statusCode || err?.statusCode || err?.status;
        if (statusCode === 500) {
            console.log(`Skipped group event for ${Nick.id}: WhatsApp returned HTTP 500.`);
        } else {
            console.error(`Unable to read group metadata for ${Nick.id}:`, err?.message || err);
        }
        return;
    }

    try {
        let participants = Nick.participants;
        let desc = metadata.desc || "No Description";
        let groupMembersCount = metadata.participants.length;

        for (const participant of participants) {
            // Newer Baileys versions may provide participant objects instead
            // of plain JID strings.
            const num = typeof participant === "string"
                ? participant
                : participant?.id || participant?.jid;
            if (!num || typeof num !== "string") continue;
            let dpuser;

            try {
                dpuser = await client.profilePictureUrl(num, "image");
            } catch {
                dpuser = "https://files.catbox.moe/m38sqm.jpg";
            }

            if (Nick.action === "add") {
                let userName = num;

                let Welcometext = `@${userName.split("@")[0]} Holla👋,\n\nWelcome to ${metadata.subject}.\n\nYou might want to read group description,\nFollow group rules to avoid being removed.\n\n ${botname} 2025.`;
                if (welcomegoodbye === 'TRUE') {
                    await client.sendMessage(Nick.id, {
                        image: { url: dpuser },
                        caption: Welcometext,
                        mentions: [num],
                        });
                }
            } else if (Nick.action === "remove") {
                let userName2 = num;

                let Lefttext = `@${userName2.split("@")[0]} Goodbye we shall miss you😔.\n\nAnyway Goodbye .`;
                if (welcomegoodbye === 'TRUE') {
                    await client.sendMessage(Nick.id, {
                        image: { url: dpuser },
                        caption: Lefttext,
                        mentions: [num],
                    });
                }
               }
              }
             } catch (err) {
        console.log(err);
    }
};

module.exports = Events;
