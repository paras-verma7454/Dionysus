import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { pollCommits } from "~/lib/github";
import { indexGithubRepo } from "~/lib/github-loader";
import { ArrowUpZA } from "lucide-react";

export const projectRouter = createTRPCRouter({

    createProject: protectedProcedure.input(z.object({
        name: z.string(),
        repoUrl: z.string(),
        gitHubToken: z.string().optional(),
    })).mutation(async ({ctx, input}) => {
        const {name, repoUrl, gitHubToken}= input;
        const project = await ctx.db.project.create({
            data: {
                name,
                repoUrl,
                gitHubToken,
                userToProjects:{
                    create:{
                        userId: ctx.user.userId!,
                    }
                }
            },
        });
        await pollCommits(project.id);
        await indexGithubRepo(project.id, repoUrl, gitHubToken);
        return project;
    }),
    getProjects: protectedProcedure.query(async ({ctx}) => {
        return await ctx.db.project.findMany({
            where: {
                userToProjects: {some: {userId: ctx.user.userId!}},
                deletedAt: null,
            },
        });
    }),
    getCommits: protectedProcedure.input(z.object({
        projectId: z.string(),
    })).query(async ({ctx, input}) => {
        const {projectId} = input;

        console.log(`polling commits for project ${projectId}`);

        pollCommits(projectId)
            .then(() => {
                console.log(`Successfully polled commits for project ${projectId}`);
            })
            .catch((error) => {
                console.error(`Error polling commits for project ${projectId}`, error);
            });

        return await ctx.db.commit.findMany({
            where: {projectId},
        });
    }),

    saveAnswer: protectedProcedure.input(z.object({
        projectId: z.string(),
        question: z.string(),
        answer: z.string(),
        filesRefrences:z.any()
    })).mutation(async ({ctx, input}) => {
        return await ctx.db.question.create({
            data:{
                answer: input.answer,
                filesRefrences:input.filesRefrences,
                projectId: input.projectId,
                question: input.question,
                userId: ctx.user.userId!,
            }
        })
    }),
    
    getQuestions: protectedProcedure.input(z.object({
        projectId: z.string(),
    })).query(async ({ctx, input}) => {
        return await ctx.db.question.findMany({
            where: {projectId: input.projectId},
            include:{
                user: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }),

    uploadMeeting: protectedProcedure.input(z.object({
        projectId: z.string(),
        meetingUrl: z.string(),
        name: z.string(),
    })).mutation(async ({ctx, input}) => {
        const meeting = await ctx.db.meeting.create({
            data:{
                meetingUrl: input.meetingUrl,
                name: input.name,
                projectId: input.projectId,
                status: 'PROCESSING',
            }
        })
        return meeting
    }),

    getMeetings: protectedProcedure.input(z.object({
        projectId: z.string(),
    })).query(async ({ctx, input}) => {
        return await ctx.db.meeting.findMany({
            where: {projectId: input.projectId},
            include:{
                issues: true,
            }
        });
    }),
    
    deleteMeeting: protectedProcedure.input(z.object({
        meetingId: z.string(),
    })).mutation(async ({ctx, input}) => {
        return await ctx.db.meeting.delete({
            where: {id: input.meetingId},
        });
    })
});
