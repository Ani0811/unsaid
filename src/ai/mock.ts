import type { Mode, Message } from '../types';

/**
 * Intelligent, mode-aware offline reflection generator.
 * Used for instant testing and demonstration when LM Studio is not running.
 * Strictly maintains the exact same boundaries as the Gemma system prompts.
 */
export async function generateReflectiveResponse(
  mode: Mode,
  history: Message[],
  onChunk?: (text: string) => void
): Promise<string> {
  const lastUserMsg = [...history].reverse().find((m) => m.role === 'user')?.content || '';
  const clean = lastUserMsg.toLowerCase().trim();

  let response = '';

  if (mode === 'talk') {
    if (clean.includes('overwhelm') || clean.includes('tired') || clean.includes('exhaust')) {
      response = `It sounds like things have been feeling really heavy and relentless lately.\n\nWhen everything piles up all at once, even small tasks can feel like a mountain. There's no pressure here to figure out every piece of it right now.\n\nIf you want to untangle it a little, is there one particular part that feels like it's taking up the most space in your head?`;
    } else if (clean.includes('decision') || clean.includes('choice') || clean.includes('crossroad')) {
      response = `Standing at a crossroads can be exhausting, especially when every option carries its own weight.\n\nOften we spin in circles because part of us wants certainty that just isn't available yet.\n\nWhat feels like the scariest outcome if you chose what your gut is leaning toward?`;
    } else {
      response = `Thank you for sharing that. It sounds like this has been lingering in your mind for a while.\n\nSometimes just giving a thought some room to breathe outside your own head brings a little more clarity.\n\nHow has holding this been affecting your day-to-day energy?`;
    }
  } else if (mode === 'unload') {
    response = `I hear you. I'm holding this space for you, and you don't have to fix, explain, or apologize for any of it.\n\nIt feels like there's a lot of pent-up noise and tension that just needed a place to land. It's completely safe here to leave it.\n\nFeel free to keep dumping more if there is more left inside, or just let it sit here and take a slow breath.`;
  } else if (mode === 'unsaid') {
    // Mode is UNSAID
    response = `It takes courage to look directly at the words we keep inside.\n\nWe cannot know for sure how they would react or what they are experiencing on their end, but it's very clear what you wish was acknowledged: you wanted them to understand how much this mattered to you, without having to minimize your own feelings.\n\nIf you were to boil what you wrote down into its rawest, most honest essence, what is the single thing you wish they could hear the most?`;
  }

  // Simulate calm human-paced streaming if callback provided
  if (onChunk) {
    const words = response.split(' ');
    let current = '';
    for (const word of words) {
      current += (current ? ' ' : '') + word;
      onChunk(current);
      await new Promise((resolve) => setTimeout(resolve, 35));
    }
  }

  return response;
}
