import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateCoverLetter(profile: any, job: any) {
  const prompt = `Write a concise, professional cover letter for ${profile.name} applying for "${job.title}" at "${job.company}". 
  Use these CV highlights: ${profile.cvHighlights}. 
  Style matches: ${job.tags.join(', ')}.
  Keep it to 3 short paragraphs. confident and remote-ready tone. Return only the letter text.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text;
}

export async function generateEmailDraft(profile: any, job: any) {
  const prompt = `Write a very short job application email for ${profile.name} applying for "${job.title}" at "${job.company}". 
  Mention CV and portfolio (${profile.portfolio}). 
  Keep it to 4 sentences max. Receiver is ${job.email || 'hiring team'}. Return only the email body.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text;
}

export async function rankJobs(preferences: any, jobs: any[], profile?: any) {
    if (!profile || !profile.cvHighlights) {
      return jobs.map(j => ({ ...j, match: 70 })).sort((a, b) => b.match - a.match);
    }

    const prompt = `Rank these job listings based on the user's CV highlights and preferences.
    User CV: ${profile.cvHighlights}
    Preferences: ${JSON.stringify(preferences)}
    
    Jobs to Rank:
    ${jobs.map((j, i) => `ID ${i}: ${j.title} at ${j.company}. Tags: ${j.tags.join(', ')}`).join('\n')}
    
    Return a JSON array of objects with "index" and "match" (0-100 score). Format: [{"index": 0, "match": 85}, ...]`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
        });
        const text = response.text;
        const jsonMatch = text.match(/\[.*\]/s);
        if (jsonMatch) {
            const rankings = JSON.parse(jsonMatch[0]);
            return jobs.map((j, i) => {
                const rank = rankings.find((r: any) => r.index === i);
                return { ...j, match: rank ? rank.match : 50 };
            }).sort((a, b) => b.match - a.match);
        }
    } catch (err) {
        console.error("Ranking error:", err);
    }
    
    return jobs.map(j => ({ ...j, match: 75 })).sort((a, b) => b.match - a.match);
}
