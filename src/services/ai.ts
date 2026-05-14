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

export async function rankJobs(preferences: any, jobs: any[]) {
    // This is a mock ranking for now, but could use AI to score matches
    return jobs.map(j => ({
        ...j,
        match: Math.floor(Math.random() * 20) + 75 // Random high match for demo
    })).sort((a, b) => b.match - a.match);
}
