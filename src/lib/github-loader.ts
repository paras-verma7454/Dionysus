import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import { Document } from "@langchain/core/documents";
import { generateEmbedding, summariseCode } from "./gemini";
import { db } from "~/server/db";

/**
 * Load all files from a GitHub repo using LangChain’s GithubRepoLoader.
 */
export const loadGithubRepo = async (repoUrl: string, githubToken?: string) => {
  const loader = new GithubRepoLoader(repoUrl, {
    accessToken: githubToken || process.env.GITHUB_ACCESS_TOKEN as string,
    branch: "main",
    ignoreFiles: [
      "package-lock.json",
      "yarn.lock",
      "pnpm-lock.yaml",
      "bun.lockb",
    ],
    recursive: true,
    unknown: "warn",
    maxConcurrency: 5,
  });

  return loader.load();
};

/**
 * Generate embeddings for each document in the repo.
 */
export const generateEmbeddings = async (docs: Document[]) => {
  console.log("generating embeddings-------------------");
  return Promise.all(
    docs.map(async (doc) => {
      const summary = await summariseCode(doc);
      const embedding = await generateEmbedding(summary);

      return {
        summary,
        embedding,
        sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
        fileName: doc.metadata.source,
      };
    })
  );
};

/**
 * Index a GitHub repo into the database.
 */
export const indexGithubRepo = async (
  projectId: string,
  repoUrl: string,
  githubToken?: string
) => {
  const docs = await loadGithubRepo(repoUrl, githubToken);
  const allEmbeddings = await generateEmbeddings(docs);

  await Promise.allSettled(
    allEmbeddings.map(async (embedding, index) => {
      console.log(`processing ${index + 1} of ${allEmbeddings.length}`);
      if (!embedding) return;

      const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
        data: {
          summary: embedding.summary,
          sourceCode: embedding.sourceCode,
          fileName: embedding.fileName,
          projectId,
        },
      });

      // Convert JS array into a Postgres-compatible vector string
      const vectorString = `[${embedding.embedding.join(",")}]`;

      await db.$executeRaw`
        UPDATE "SourceCodeEmbedding"
        SET "summaryEmbedding" = ${vectorString}::vector
        WHERE "id" = ${sourceCodeEmbedding.id}
      `;
    })
  );
};

/**
 * Estimate "credits" (number of files in the repo).
 * This reuses GithubRepoLoader so we don’t make extra API calls.
 */
export const checkCredits = async (repoUrl: string, githubToken?: string) => {
  const docs = await loadGithubRepo(repoUrl, githubToken);
  return docs.length; // just return number of files
};
