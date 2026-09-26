import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import * as dotenv from 'dotenv';

dotenv.config();

// ES module path support
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Helper to safely fetch Gemini Client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. API: Analyze Product Image (or prompt)
app.post('/api/analyze-product', async (req, res) => {
  try {
    const { rawImage, manualDescription } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      console.log('Gemini API key is unconfigured. Returning highly detailed offline template.');
      const keyword = (manualDescription || 'Skincare essence').toLowerCase();
      // Generate realistic descriptive template based on user manual prompt
      return res.json({
        name: keyword.includes('serum') ? 'GlowHydra Vitamin C' : 'Oval Essence Glow',
        function: `An ultra-light, highly bioavailable nourishing formulation designed to lock in essential moisture while actively targeting dark spots, uneven texture, and early signs of environmental fatigue.`,
        benefits: `• Promotes a bright, uniform skin tone and healthy radiance\n• Deeply hydrates across dermis layers for plump bounce\n• Strengthens skin micro-barrier against urban dirt and oxidant stress`,
        targetAudience: `Young professionals (18–35), beauty enthusiasts, individuals with dull, sensitive, or late-night fatigue skin.`,
        category: `Skincare / Premium Beauty`,
        marketingAngle: `The "Honest 7-Day Challenge" style. Leverage casual self-recorded morning routines showing active glass-skin results before and after application.`,
        isFallback: true,
      });
    }

    let response;
    if (rawImage) {
      // Clean up base64 prefix
      const base64Data = rawImage.replace(/^data:image\/\w+;base64,/, '');
      const imagePart = {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data,
        },
      };

      const promptPart = {
        text: `You are an expert UGC marketing analyst. Analyze this product image and generate a structured JSON containing:
        - name (matching the visible branding/logo or reasonable premium name)
        - function (one-paragraph precise description of what it does)
        - benefits (3 distinct bullet points separated by newlines)
        - targetAudience (who is this product positioned for?)
        - category (e.g., Skincare, Tech Accessories, Health Supplement, Fitness, etc.)
        - marketingAngle (the absolute best viral marketing angle to sell this product on TikTok/Shorts)`,
      };

      response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [imagePart, promptPart],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              function: { type: Type.STRING },
              benefits: { type: Type.STRING },
              targetAudience: { type: Type.STRING },
              category: { type: Type.STRING },
              marketingAngle: { type: Type.STRING },
            },
            required: ['name', 'function', 'benefits', 'targetAudience', 'category', 'marketingAngle'],
          },
        },
      });
    } else {
      // Analyze text description
      response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Analyze the following product description and generate a structured JSON with:
        - name (premium product name)
        - function (expert explanation of function)
        - benefits (3 bullet points separated by newlines)
        - targetAudience (who will buy this, ages, interests)
        - category (the industry niche)
        - marketingAngle (the highest-converting viral hook angle)

        Product description: "${manualDescription}"`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              function: { type: Type.STRING },
              benefits: { type: Type.STRING },
              targetAudience: { type: Type.STRING },
              category: { type: Type.STRING },
              marketingAngle: { type: Type.STRING },
            },
            required: ['name', 'function', 'benefits', 'targetAudience', 'category', 'marketingAngle'],
          },
        },
      });
    }

    if (response && response.text) {
      return res.json(JSON.parse(response.text));
    } else {
      throw new Error('Emply response received from Gemini.');
    }
  } catch (error: any) {
    console.error('API Error in analyze-product:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// 2. API: Generate Campaign Details
app.post('/api/generate-campaign', async (req, res) => {
  try {
    const { campaignState } = req.body;
    const ai = getGeminiClient();

    const {
      product,
      character,
      background,
      aspectRatio,
      cameraAngle,
      visualStyle,
      storyboardScenesCount,
      voiceOverStyle,
      voiceOverDuration,
    } = campaignState;

    if (!ai) {
      console.log('Gemini API key is unconfigured. Returning premium mocked outputs.');
      // Return beautiful contextual mock data matched with user choices
      const name = product.name || 'Glow Essence';
      const cat = product.category || 'Skincare / Beauty';
      return res.json(
        getMockCampaignData(
          name,
          cat,
          character.gender,
          character.hijab,
          voiceOverStyle,
          storyboardScenesCount,
          cameraAngle,
          visualStyle
        )
      );
    }

    const systemPrompt = `You are an elite UGC (User Generated Content) creative agency director.
Your goal is to build an absolute masterclass viral UGC marketing campaign for a product.
The output MUST be in valid JSON format matching exactly the specified structure.`;

    const userPrompt = `Generate a fully synchronized UGC marketing campaign with the following parameters:
- Product Name: ${product.name}
- Product Category: ${product.category}
- Product Function: ${product.function}
- Key Benefits: ${product.benefits}
- Target Audience: ${product.targetAudience}
- Marketing Angle: ${product.marketingAngle}
- Character Model Choice: Gender=${character.gender}, Age=${character.ageRange}, Hijab=${character.hijab}
- Requested Background Aesthetic: ${background.selected} ${background.selected === 'Custom' ? `(${background.customPrompt})` : ''}
- Camera Angle: ${cameraAngle}
- Visual Framing Style: ${visualStyle}
- Storyboard Scene Count: ${storyboardScenesCount}
- Voice Over Style preference: ${voiceOverStyle}
- Custom Video Frame Ratio: ${aspectRatio}
- Voice Over Target Duration: ${voiceOverDuration} seconds

Please output a JSON containing:
1. "backgrounds": An array of 10 customized background suggestions suited for this product and model.
2. "storyboard": An array of EXACTLY ${storyboardScenesCount} sequential scenes. Each scene must include:
   - "sceneNum" (number)
   - "description" (what happens visually)
   - "cameraAngle" (camera direction/style)
   - "characterExpression" (facial/emotional look)
   - "characterActivity" (exact physical interaction with the product)
   - "visualPrompt" (highly descriptive photorealistic AI generation prompt to visualize this scene)
   - "suggestedVoiceover" (spoken narrative text for this scene)
3. "voiceover": An object representing the unified audio track matching the ${voiceOverDuration}s duration:
   - "style" (matching ${voiceOverStyle})
   - "duration" (target duration: ${voiceOverDuration})
   - "hook" (the conversational attention grabber, 1 sentence)
   - "script" (fluent natural narrative to speak, matching scenes flows)
   - "cta" (conversion focus closing, 1 sentence)
4. "marketing": An object containing copywriting deliverables:
   - "hooks" (Array of EXACTLY 10 different high-converting viral hooks)
   - "captions" (Array of EXACTLY 10 strategic marketing captions with call-to-actions)
   - "hashtags" (Array of EXACTLY 30 trending relevant hashtags including UGC, review formats, and category-specific hashtags)
5. "prompts": An object containing prompt deliverables for Feature 10:
   - "visualPromptOnly" (a dense descriptive generator text prompt)
   - "visualPromptWithVoice" (an object containing "visualPrompt", "voiceoverScript" matching scenes, and "lipSyncInstructions" explaining how the mouth syncs with the generated voiceover naturally).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            backgrounds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            storyboard: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sceneNum: { type: Type.INTEGER },
                  description: { type: Type.STRING },
                  cameraAngle: { type: Type.STRING },
                  characterExpression: { type: Type.STRING },
                  characterActivity: { type: Type.STRING },
                  visualPrompt: { type: Type.STRING },
                  suggestedVoiceover: { type: Type.STRING },
                },
                required: [
                  'sceneNum',
                  'description',
                  'cameraAngle',
                  'characterExpression',
                  'characterActivity',
                  'visualPrompt',
                  'suggestedVoiceover',
                ],
              },
            },
            voiceover: {
              type: Type.OBJECT,
              properties: {
                style: { type: Type.STRING },
                duration: { type: Type.INTEGER },
                hook: { type: Type.STRING },
                script: { type: Type.STRING },
                cta: { type: Type.STRING },
              },
              required: ['style', 'duration', 'hook', 'script', 'cta'],
            },
            marketing: {
              type: Type.OBJECT,
              properties: {
                hooks: { type: Type.ARRAY, items: { type: Type.STRING } },
                captions: { type: Type.ARRAY, items: { type: Type.STRING } },
                hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['hooks', 'captions', 'hashtags'],
            },
            prompts: {
              type: Type.OBJECT,
              properties: {
                visualPromptOnly: { type: Type.STRING },
                visualPromptWithVoice: {
                  type: Type.OBJECT,
                  properties: {
                    visualPrompt: { type: Type.STRING },
                    voiceoverScript: { type: Type.STRING },
                    lipSyncInstructions: { type: Type.STRING },
                  },
                  required: ['visualPrompt', 'voiceoverScript', 'lipSyncInstructions'],
                },
              },
              required: ['visualPromptOnly', 'visualPromptWithVoice'],
            },
          },
          required: ['backgrounds', 'storyboard', 'voiceover', 'marketing', 'prompts'],
        },
      },
    });

    if (response && response.text) {
      return res.json(JSON.parse(response.text));
    } else {
      throw new Error('Empty response received from campaign generator.');
    }
  } catch (error: any) {
    console.error('API Error in generate-campaign:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// Helper for high-fidelity responsive fallback campaign mock data
function getMockCampaignData(
  pName: string,
  pCategory: string,
  gender: string,
  hijab: string,
  voStyle: string,
  sceneCount: number,
  cameraAngle: string,
  visualStyle: string
) {
  // Generate customized suggested backgrounds
  const backgrounds = [
    'Aesthetic Bedroom - Warm morning sunlight filtering onto cream cotton linens.',
    'Minimalist Bedroom - Clean Scandinavian design, neutral tones, potted Monstera leaf.',
    'Modern Cafe - Cozy corner Table, marble surface, soft ambient social background.',
    'Workspace Setup - Oak table, aesthetic laptop, soft warm ring-light casting.',
    'Clean Kitchen - Bright white marble countertops, minimalist herb jars, natural slate tile.',
    'White Studio - High-key professional backdrops, soft diffused beauty shadows.',
    'Outdoor Nature - Sun-drenched garden deck, green lush monstera and palms.',
    'Luxury Interior - Brushed gold trims, velvet furnishings, luxury vanity lighting.',
    'Modern Living Room - Soft pastel cushions, sleek modern shelves, bright day window.',
    'Beauty Corner - Backlit makeup mirror, professional display cases, sleek acrylic drawers.',
  ];

  // Storyboard generator
  const storyboard: any[] = [];
  const modelVerbage = gender === 'Female' ? (hijab === 'Yes' ? 'female hijabi creator' : 'female content creator') : 'male content creator';

  const scenesPrompts = [
    {
      desc: `Introductory Hook. The camera mimics an authentic handheld phone camera view. The creator starts by looking into the camera while gesturing naturally.`,
      act: `Holds ${pName} casually next to their cheek, showing its premium packaging.`,
      expr: `Relatable, smiling, eye contact with the viewer.`,
      vo: `I have literally replaced my entire routine for this one product, and here is exactly why...`,
    },
    {
      desc: `Detailed product application shot. Focus turns to the product texture and direct skin contact with high detail.`,
      act: `Opens the bottle/container, applies a small amount to skin, demonstrating smooth texture.`,
      expr: `Satisfied, glowing, thoroughly enjoying the sensorial feel.`,
      vo: `The second you apply this, you feel immediate deep hydration without any heavy grease. It's so airy!`,
    },
    {
      desc: `Focus on active benefits and immediate radiance reaction. Over the shoulder perspective capturing high clarity detail.`,
      act: `Gently pats the product onto their forehead and cheekbones, revealing a beautiful dewy finish.`,
      expr: `Impressed, smiling widely, admiring the skin glow in a direct mirror.`,
      vo: `Its active extracts go to work instantly. See that glass-skin finish? It literally stays luminous clean all day long.`,
    },
    {
      desc: `Contrast demonstration or scenario. Extreme macro highlight focusing purely on the product texture and fluid integration.`,
      act: `Holds the bottle forward close to the camera, tilting it to display the rich high-quality formulation.`,
      expr: `Relatable, friendly, nod of passionate reassurance.`,
      vo: `Most alternatives leave heavy sticky residue, but this sinks right in and works perfectly under makeup or post-workout.`,
    },
    {
      desc: `Final call-to-action out-shot. The camera backs up into a wider framing. The creator holds up the product proudly pointing downward.`,
      act: `Holds up ${pName}, winks or smiles, pointing to the interactive link on screen.`,
      expr: `Confident, enthusiastic, high energy.`,
      vo: `Oval Studio creators and brand partners are losing their minds over this. Grab yours now while the batch lasts!`,
    },
  ];

  for (let i = 1; i <= sceneCount; i++) {
    const templateIdx = (i - 1) % scenesPrompts.length;
    const template = scenesPrompts[templateIdx];
    storyboard.push({
      sceneNum: i,
      description: `${template.desc} (Scene ${i})`,
      cameraAngle: i === 1 ? cameraAngle : 'Macro Details Focus',
      characterExpression: template.expr,
      characterActivity: template.act,
      visualPrompt: `A photorealistic portrait of an athletic, photorealistic ${modelVerbage}, medium close-up, natural lighting on soft background, high skin details, showing ${template.act}, cinematic, UGC layout`,
      suggestedVoiceover: template.vo,
    });
  }

  // Voiceover Matcher
  const voiceover = {
    style: voStyle,
    duration: 30,
    hook: `If you are still struggling with ${pCategory.toLowerCase()}, you need to stop scrolling right now.`,
    script: `This completely changed how I look at my daily routine. The formula is packed with pure concentrated botanical nutrients that get absorbed instantly. I've been putting this on every morning, and the visible bounce and texture smoothness speak for themselves. Seriously, no filter, just pure, honest results.`,
    cta: `Tap the link below right now to claim your exclusive trial package before they sell out!`,
  };

  // Content Copywriting generator
  const hooks = [
    `Nobody is talking about this hidden gem for ${pCategory.toLowerCase()}...`,
    `I tested this product for 7 days straight and the results literally shocked me!`,
    `Stop scrolling if you want to fix your ${pCategory.toLowerCase()} issues forever.`,
    `This is my absolute favorite find of 2026, and it's not even close.`,
    `I wish I had discovered this ${pName} sooner—it would have saved me hundreds of dollars.`,
    `The dirty secret that brands don't want you to know about ${pCategory.toLowerCase()}`,
    `This 10-second habit completely transformed my entire aesthetic.`,
    `Is ${pName} actually worth the viral hype? An honest review.`,
    `Three reasons why your current routine is failing you daily.`,
    `My skin/life has never looked better, and here is my one-step secret.`,
  ];

  const captions = [
    `Honestly, my skin has never felt this plump and happy. Say hello to your new daily holy grail: ${pName}! ✨ #UGCReview`,
    `Day 5 progress using ${pName} and the mirror doesn't lie. Grab yours at the link in my bio! 🛍️`,
    `No filters, no heavy edits, just raw results. This bottle literally changed everything for me. #skincarehacks #UGC`,
    `Why pay for expensive luxury treatments when this one formula does it all? Truly obsessed. 🧴💙`,
    `Unboxing the internet's most viral sensation. Will it live up to the standard? Watch to find out!`,
    `My morning routine is officially incomplete without a heavy dose of ${pName}. Absolute game-changer.`,
    `The target audience for this is anyone tired of dull looking results. Trust me on this one! 🌿✨`,
    `Clean beauty, minimalist vibes, and maximum efficacy. Oval Studio creator authenticated. #ugccommunity`,
    `The secret's officially out! Let me know if you want a part 2 on my full week routine! 💬👇`,
    `Save this video so you don't forget to order yours tonight! Thank me later. ⏰✈️`,
  ];

  const hashtags = [
    'UGC',
    'ProductReview',
    'TikTokShop',
    'InstagramReels',
    'BrandAwareness',
    'ViralBeauty',
    'OvalStudio',
    'UGCGenerator',
    'HonestOpinion',
    'UnboxingVideo',
    'CreatorEconomy',
    'UGCStyle',
    'ProductPlacement',
    'RoutineEssential',
    'NoFilterRadiance',
    'HealthySkinJourney',
    'ValueForMoney',
    'ShoppingHaul',
    'SkincareLovers',
    'MustHaveFinds',
    'BeautyTrends2026',
    'NicheMarketing',
    'Microinfluencer',
    'ViralUGC',
    'AuthenticCreators',
    'BehindTheScenes',
    'ModernLifestyle',
    'SelfCareDaily',
    'SkincareAddict',
    'UGCIndonesia',
  ];

  const marketing = {
    hooks,
    captions,
    hashtags,
  };

  // Visual Prompts Option A and B
  const prompts = {
    visualPromptOnly: `A highly realistic UGC video frame of a ${modelVerbage} holding the ${pName} product bottle proudly, looking at the camera, aesthetic morning studio light, natural depth of field, authentic iphone quality output.`,
    visualPromptWithVoice: {
      visualPrompt: `Close-up shot of a ${modelVerbage} speaking directly into the smartphone microphone, holding ${pName} showing the liquid texture, dewy skin highlights, aesthetic domestic backdrop.`,
      voiceoverScript: `I spent ages looking for a product that actually delivers. This is that product. Watch how easily it absorbs!`,
      lipSyncInstructions: `Match mouth shape movements to the phonemes of 'spent ages looking for a product that actually delivers' with a conversational, friendly jaw drop and slight head inclination.`,
    },
  };

  return {
    backgrounds,
    storyboard,
    voiceover,
    marketing,
    prompts,
  };
}

// 3. Mount Vite or static assets depending on environment
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Serves compiled frontend assets
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server starting on port ${PORT}`);
  });
}

startServer();
