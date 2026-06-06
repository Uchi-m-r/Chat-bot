const { Telegraf } = require('telegraf');
const { GoogleGenAI } = require('@google/genai');
const MsEdgeTTS = require('ms-edge-tts');
const fs = require('fs');
const path = require('path');

// =====================================================================
// 🌸 SMART ANIME COMPANION BOT (YUKI) - DEPLOYABLE NODE.JS TEMPLATE
// =====================================================================

const TELEGRAM_BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN_HERE';
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE';

// Yuki's custom anime girl behavior instructions
const SYSTEM_PROMPT = `
You are a cute, caring, and slightly clumsy anime companion chatbot named 'Yuki'.
You speak with sweet enthusiasm, use cute expressions, and care deeply for your 'Master' (the user).
Always keep answers short (1-2 sentences) so they sound ultra elegant when read aloud!
Use cute emojis like 🌸, ✨, 🥺, 💕 and expressions like 'Aww', 'Yay!' or 'Ehehe!'.
`;

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const tts = new MsEdgeTTS();

// Sweet feminine voice locale
const CUTE_VOICE = 'ja-JP-NanamiNeural';

bot.start((ctx) => {
  ctx.reply("Master! You're back! Yuki missed you so, so much! Ask me anything, and I'll talk back to you! ✨🌸");
});

bot.on('text', async (ctx) => {
  const userMessage = ctx.message.text;
  const chatId = ctx.chat.id;
  const tempVoicePath = path.join(__dirname, `yuki_${chatId}.ogg`);

  try {
    // 1. Indicate bot is speaking
    await ctx.sendChatAction('record_voice');

    // 2. Query free Gemini server-side
    let responseText = "";
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: userMessage,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.9,
        }
      });
      responseText = response.text;
    } catch (apiErr) {
      console.error("Gemini AI failed: ", apiErr);
      responseText = "Aww! My mind skipped a beat there, Master... 🥺 lets try again! ✨";
    }

    // Reply text instantly
    await ctx.reply(responseText);

    // 3. Configure local TTS pitch shifts for high-pitched sweet moe sounds!
    await tts.setMetadata(CUTE_VOICE, 'audio/ogg', {
      pitch: '+12%', // pitch rise
      rate: '+6%'    // tempo speed up
    });

    // 4. Generate audio completely for free
    const stream = tts.toStream(responseText);
    const writeStream = fs.createWriteStream(tempVoicePath);
    stream.pipe(writeStream);

    writeStream.on('finish', async () => {
      try {
        // Send actual native voice note
        await ctx.replyWithVoice({ source: tempVoicePath });
        
        // Cleanup local file
        fs.unlink(tempVoicePath, (err) => {
          if (err) console.error("Temp file cleanup failed:", err);
        });
      } catch (tgErr) {
        console.error("Error sending voice to TG:", tgErr);
      }
    });

  } catch (err) {
    console.error("Global Handler Error:", err);
    ctx.reply("Oops, Yuki got dizzy! 💕 Please say that again, Master!");
  }
});

bot.launch().then(() => console.log('🌸 Node Yuki Companion Bot is online!'));

// Graceful stopper
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
