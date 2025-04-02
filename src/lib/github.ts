import { Octokit } from "octokit";
import { db } from "~/server/db";
import axios from "axios";
import { aiSummariseCommit } from "./gemini";

export const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN,
});


type Response ={
    commitHash: string
    commitMessage: string
    commitAuthorName: string
    commitAuthorAvatar: string
    commitDate: string
}

export const getCommitHashes = async (githubUrl: string): Promise<Response[]> => {
    const [owner, repo] = githubUrl.split("/").slice(-2);
    if (!owner || !repo) {
        throw new Error("Invalid github url");
    }
    const {data} = await octokit.rest.repos.listCommits({
        owner,
        repo,

    });
    
    const sortedCommits = data.sort((a:any, b:any) => new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime()) as any;
    return sortedCommits.slice(0,10).map((commit: any) => ({
        commitHash: commit.sha as string,
        commitMessage: commit.commit.message ?? "",
        commitAuthorName: commit.commit?.author?.name ?? "",
        commitAuthorAvatar: commit.author?.avatar_url ?? "",
        commitDate: commit.commit?.author?.date ?? "",
    }));
};

export const pollCommits = async (prjectId: string) => {
    const {project, githubUrl} = await fetchProjectGithubUrl(prjectId);
    const commitHashes = await getCommitHashes(githubUrl);
    const unprocessedCommits = await filterUnprocessedCommits(prjectId, commitHashes);

    const summaryResponse = await Promise.allSettled(unprocessedCommits.map(async (commit) => {
        return summariseCommit(githubUrl, commit.commitHash);
    }));

    const summaries = summaryResponse.map((response) =>{
        if(response.status === "fulfilled"){
            return response.value as string;
        }
        return "";
    });
    const commits = await db.commit.createMany({
        data: summaries.map((summary, index) => {
            console.log(`Processing commit ${index}`);
            return {
                projectId: prjectId,
                commitHash: unprocessedCommits[index]!.commitHash,
                commitMessage: unprocessedCommits[index]!.commitMessage,
                commitAuthorName: unprocessedCommits[index]!.commitAuthorName,
                commitAuthorAvatar: unprocessedCommits[index]!.commitAuthorAvatar,
                commitDate: unprocessedCommits[index]!.commitDate,
                summary
            }
        }),
    });
    console.log(`commits created: ${commits.count}`);
    return commits;

}; 

async function summariseCommit(githubUrl: string, commitHash: string) {
    const {data} = await axios.get(`${githubUrl}/commit/${commitHash}.diff`,{
        headers: {
            "Accept": "application/vnd.github.v3+json",
        },
    });
    const summary = await aiSummariseCommit(data);
    return summary ? summary : "No summary available";
}

async function fetchProjectGithubUrl(prjectId: string) {
    const project = await db.project.findUnique({
        where: {
            id: prjectId,
        },
        select: {
            repoUrl: true,
        }, 
    });
    if (!project?.repoUrl) {
        throw new Error("Project has no repo url");
    }
    return {
        project,
        githubUrl: project.repoUrl,
    };
}

async function filterUnprocessedCommits(prjectId: string, commitHashes: Response[]) {
    const processedCommits = await db.commit.findMany({
        where: {
            projectId: prjectId,
        },
        select: {
            commitHash: true,
        },
    });
    const unprocessedCommits = commitHashes.filter((commit) => !processedCommits.some((c) => c.commitHash === commit.commitHash));
    return unprocessedCommits;
}
