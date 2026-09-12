const fs = require('fs');
const path = require('path');
const welcomegoodbye = process.env.WELCOMEGOODBYE || 'FALSE';
const botname = process.env.BOTNAME || 'Black-Demon🐈‍⬛🖤';
const BRAND_IMAGE = fs.readFileSync(path.join(__dirname, '..', 'assets', 'jinwiil-tech.png'));

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
        const participants = Nick.participants;
        for (const participant of participants) {
            const num = typeof participant === 'string'
                ? participant
                : participant?.id || participant?.jid;
            if (!num || typeof num !== 'string') continue;

            let dpuser;
            try {
                dpuser = await client.profilePictureUrl(num, 'image');
            } catch {
                dpuser = BRAND_IMAGE;
            }
            const imagePayload = Buffer.isBuffer(dpuser) ? dpuser : { url: dpuser };

            if (Nick.action === 'add') {
                const userName = num;
                const welcomeText = `@${userName.split('@')[0]} Holla👋,\n\nWelcome to ${metadata.subject}.\n\nYou might want to read group description,\nFollow group rules to avoid being removed.\n\n${botname} 2025.`;
                if (welcomegoodbye === 'TRUE') {
                    await client.sendMessage(Nick.id, {
                        image: imagePayload,
                        caption: welcomeText,
                        mentions: [num]
                    });
                }
            } else if (Nick.action === 'remove') {
                const userName = num;
                const goodbyeText = `@${userName.split('@')[0]} Goodbye we shall miss you😔.\n\nAnyway Goodbye.`;
                if (welcomegoodbye === 'TRUE') {
                    await client.sendMessage(Nick.id, {
                        image: imagePayload,
                        caption: goodbyeText,
                        mentions: [num]
                    });
                }
            }
        }
    } catch (err) {
        console.log(err);
    }
};

module.exports = Events;
