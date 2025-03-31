// Start by making sure the `assemblyai` package is installed.
// If not, you can install it by running the following command:
// npm install assemblyai

import { AssemblyAI } from 'assemblyai';

const client = new AssemblyAI({
  apiKey: 'd346c2df5e4f4d81a3ce52d91c59bda1',
});

const FILE_URL =
  'https://assembly.ai/sports_injuries.mp3';

function msToTime(ms:number){
    const seconds= ms/1000
    const minutes= Math.floor(seconds/60)
    const remainingSeconds= Math.floor(seconds%60)
    return `${minutes.toString().padStart(2,'0')}:${remainingSeconds.toString().padStart(2,'0')}`
}

export const processMeeting = async (meetingUrl: string) => {
    const transcript = await client.transcripts.transcribe({
        audio: meetingUrl,
        auto_chapters: true,
    })

    const summaries = transcript.chapters?.map(chapter=>({
        start: msToTime(chapter.start),
        end: msToTime(chapter.end),
        gist:chapter.gist,
        headline:chapter.headline,
        summary: chapter.summary
    })) || []

    if(!transcript.text) throw new Error('No transcript found')


    return {
        summaries

    }
}
