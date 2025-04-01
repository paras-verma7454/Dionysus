"use client"
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import useProject from '~/hooks/use-project'
import { cn } from '~/lib/utils'
import { api } from '~/trpc/react'

const CommitLog = () => {
    const {projectId, project} = useProject()
    const {data: commits, error} = api.project.getCommits.useQuery({projectId}, {
        enabled: !!project?.repoUrl // Only fetch if project has a repo URL
    })

    if (!project?.repoUrl) {
        return (
            <div className="text-sm text-gray-500">
                No project selected.
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-sm text-red-500">
                Error loading commits: {error.message}
            </div>
        )
    }

    if (!commits?.length) {
        return (
            <div className="text-sm text-gray-500">
                No commits found for this repository.
            </div>
        )
    }

    return (
        <>
            <p className='text-sm text-gray-500 pb-2'>Latest commits</p>
            <ul className='space-y-6'>
                {commits
                    .sort((a, b) => new Date(b.commitDate).getTime() - new Date(a.commitDate).getTime())
                    .map((commit, commitIdx) => (
                        <li key={commit.id} className='relative flex gap-x-4'>
                            <div
                                className={cn(
                                    commitIdx === commits.length - 1 ? 'h-6' : '-bottom-6',
                                    'absolute left-0 top-0 flex w-6 justify-center'
                                )}
                            >
                                <div className='w-px translate-x-1 bg-gray-200'></div>
                            </div>

                            <>
                                <img
                                    src={commit.commitAuthorAvatar}
                                    alt={'commit Avatar'}
                                    className='relative mt-4 size-8 flex-none bg-gray-50 rounded-full'
                                />
                                <div className='flex-auto rounded-md p-3 ring-1 ring-inset ring-border'>
                                    <div className='flex justify-between gap-x-4'>
                                        <Link
                                            href={`${project?.repoUrl}/commit/${commit.commitHash}`}
                                            target='_blank'
                                            className='py-0.5 text-xs leading-5 text-muted-foreground'
                                        >
                                            <span className='font-medium text-foreground'>
                                                {commit.commitAuthorName}
                                            </span>{' '}
                                            <span className='inline-flex items-center'>
                                                Commited
                                                <ExternalLink className='ml-1 size-4' />
                                            </span>
                                        </Link>
                                        <p className='text-sm text-muted-foreground'>
                                            {new Date(commit.commitDate).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <span className='font-semibold text-foreground'>{commit.commitMessage}</span>
                                    <div className='mt-2 whitespace-pre-wrap text-muted-foreground text-sm leading-6'
                                        dangerouslySetInnerHTML={{
                                            __html: commit.summary
                                                .replace(/(\*{2})(.*?)\1/g, '<b>$2</b>')
                                                .replace(/(['"`])(.*?)\1/g, '<b>$2</b>'),
                                        }}
                                    />
                                </div>
                            </>
                        </li>
                    ))}
            </ul>
        </>
    )
}

export default CommitLog