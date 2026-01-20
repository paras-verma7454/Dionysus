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

export const getCommitHashes = async (githubUrl: string, githubToken?: string): Promise<Response[]> => {
    const [owner, repo] = githubUrl.split("/").slice(-2);
    if (!owner || !repo) {
        throw new Error("Invalid github url");
    }
    const octokit = new Octokit({
        auth: githubToken || process.env.GITHUB_ACCESS_TOKEN,
    });
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

export const getDefaultBranch = async (githubUrl: string, githubToken?: string): Promise<string> => {
    const [owner, repo] = githubUrl.split("/").slice(-2);
    if (!owner || !repo) {
        throw new Error("Invalid github url");
    }
    const octokit = new Octokit({
        auth: githubToken || process.env.GITHUB_ACCESS_TOKEN,
    });
    const { data } = await octokit.rest.repos.get({
        owner,
        repo,
    });
    return data.default_branch;
};

export const pollCommits = async (projectId: string) => {
    const {project, githubUrl} = await fetchProjectGithubUrl(projectId);
    const commitHashes = await getCommitHashes(githubUrl, project.gitHubToken ?? undefined);
    const unprocessedCommits = await filterUnprocessedCommits(projectId, commitHashes);

    const summaryResponse = await Promise.allSettled(unprocessedCommits.map(async (commit) => {
        return summariseCommit(githubUrl, commit.commitHash);
    }));

    const summaries = summaryResponse.map((response) =>{
        if(response.status === "fulfilled"){
            return response.value as string;
        }
        return "";
    });
    let commits;
    try {
        commits = await db.commit.createMany({
            data: summaries.map((summary, index) => {
                console.log(`Processing commit ${index}`);
                return {
                    projectId: projectId,
                    commitHash: unprocessedCommits[index]!.commitHash,
                    commitMessage: unprocessedCommits[index]!.commitMessage,
                    commitAuthorName: unprocessedCommits[index]!.commitAuthorName,
                    commitAuthorAvatar: unprocessedCommits[index]!.commitAuthorAvatar,
                    commitDate: unprocessedCommits[index]!.commitDate,
                    summary,
                };
            }),
            skipDuplicates: true,
        });
    } catch (err: any) {
        if (err?.code === "P2002") {
            console.warn("Duplicate commit(s) detected during createMany, skipped duplicates.");
            commits = { count: 0 } as any;
        } else {
            throw err;
        }
    }
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

async function fetchProjectGithubUrl(projectId: string) {
    const project = await db.project.findUnique({
        where: {
            id: projectId,
        },
        select: {
            repoUrl: true,
            gitHubToken: true,
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
