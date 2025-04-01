"use client"

import { VideoIcon } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { api, RouterOutputs } from '~/trpc/react'

type Props = {
    meetingId: string
}

const IssuesList = ({meetingId}:Props) => {
    const {data:meeting,isLoading} = api.project.getMeetingById.useQuery({meetingId},{
        refetchInterval:4000,
    })
    if(isLoading || !meeting){
        return <div>Loading...</div>
    }
  return (
    <>
        <div className='p-8 '>
            <div className='mx-auto flex flex-col items-center justify-between gap-x-8 border-b pb-6 lg:mx-0 lg:max-w-none lg:flex-row'> 
                <div className='flex items-center gap-x-6'>
                    <div className='rounded-full border border-gray-500 p-3'>
                        <VideoIcon className='h-6 w-6'/>
                    </div>
                    <h1>
                        <div className='text-sm leading-6 text-gray-500'>
                            Meeting on {" "}{meeting.createdAt.toLocaleDateString()}
                        </div>
                        <div className='mt-1 text-base font-semibold leading-6 '>
                            {meeting.name}
                        </div>
                        <div className='mt-4 lg:hidden'>
                            <Button variant='outline'>
                                <Link href={meeting.meetingUrl ?? ""} target='_blank'>
                                Listen to Meeting
                                </Link>
                            </Button>
                        </div>
                    </h1>
                </div>
                <div className='hidden lg:flex items-center justify-center'>
                    <Button variant='outline'>
                        <Link href={meeting.meetingUrl ?? ""} target='_blank'>
                        Listen Meeting
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="h-4"></div>

            <div className='grid grid-cols-1 gap-2 sm:grid-cols-3'>
                {meeting.issues.map(issue =>(
                    <IssueCard key={issue.id} issue={issue} />
                ))}
            </div>
        </div>
    </>
  )
}


function IssueCard({issue}:{issue: NonNullable<RouterOutputs['project']['getMeetingById']>['issues'][number]}){

    const [open, setOpen] = useState(false);
    
    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {issue.gist}
                        </DialogTitle>
                        <DialogDescription>
                            {issue.createdAt.toLocaleDateString()}
                        </DialogDescription>
                        <p className=' border-t pt-4'>
                            {issue.headline}
                        </p>
                        <blockquote className='mt-2 border-l-4 border-gray-400 bg-primary-foreground p-3 '>
                            <span className='text-sm '>
                                <span className='bg-gray-500 p-1 rounded-md'>{issue.start}</span>{" "}-{' '}<span className='bg-gray-500 p-1 rounded-md'>{issue.end}</span>
                            </span>
                            <p className='font-medium mt-2 text-gray-500'>
                                {issue.summary}
                            </p>
                        </blockquote>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        
            <Card className='relative'>
                <CardHeader>
                    <CardTitle className='text-xl'>
                        {issue.gist}
                    </CardTitle>
                    <div className="border-b"></div>
                    <CardDescription>
                        {issue.headline}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => setOpen(true)}>
                        Details
                    </Button>
                </CardContent>
            </Card>
        </>
    )
}

export default IssuesList