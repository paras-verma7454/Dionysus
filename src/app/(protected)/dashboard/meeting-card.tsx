"use client"
import React, { useState } from 'react'
import { Card } from '~/components/ui/card';
import { useDropzone } from 'react-dropzone';
import { uploadFile } from '~/lib/supabase';
import { Loader, Loader2, Presentation, Upload } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { toast } from 'sonner';
import { api } from '~/trpc/react';
import useProject from '~/hooks/use-project';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';


const MeetingCard = () => {
    const project= useProject()
    const router = useRouter();
    const processMeeting= useMutation({
        mutationFn: async ( data:{meetingUrl: string, meetingId: string, projectId: string}) =>{

            const {meetingUrl, meetingId, projectId} = data;
            console.log("Processing meeting", data)
            const response =  await axios.post('/api/process-meeting',{
                meetingUrl,
                meetingId,
                projectId
            })
            return response.data
        }
    })

    const [isUploading, setIsUploading] = useState(false);
    const uploadMeeting = api.project.uploadMeeting.useMutation()
    const {getInputProps, getRootProps}= useDropzone({
        accept:{
            'audio/*':[],
        },
        multiple: false,
        // maxSize: 50 * 1024 * 1024,  // Limit to 50 MB
        onDrop: async(acceptedFiles)=> {
            setIsUploading(true)
            console.log(acceptedFiles) 
            const file = acceptedFiles[0];
            console.log("File drop:",file)

            if (!file) {
                toast.error("Audio files only")
                setIsUploading(false)
                return
            };

            if(file?.size >= 50 * 1024 * 1024){
                toast.error("File size Limited to 50 MB")
                setIsUploading(false)
                return
            }
                const {  url } = await uploadFile(file as File)
                uploadMeeting.mutate({
                    projectId: project.projectId,
                    meetingUrl: url as string,
                    name: file.name,
                },{
                    onSuccess: (meeting) => {
                        toast.success("Meeting uploaded successfully")
                        router.push('/meetings')
                        processMeeting.mutateAsync({
                            meetingUrl: url as string,
                            meetingId: meeting.id,
                            projectId: project.projectId
                        })
                    },
                    onError: (error) => {
                        toast.error("Failed to upload meeting")
                    }
                })
                setIsUploading(false)
            
        },
    })

  return (
        <Card className='col-span-2 flex flex-col items-center justify-center p-10' {...getRootProps()}>
            {!isUploading && (
                <>
                    <Presentation className='h-10 w-10 animate-bounce'/>
                    <h3 className='mt-2 text-sm font-semibold '>
                        Create a new meeting
                    </h3>
                    <p className='mt-5 text-center text-sm text-gray-500'>
                        Analyse your meeting with Dionysus.
                        {/* <span className='text-gray-400 text-xs'>{" "}(Limit 50 MB)</span> */}
                        <br/>
                        Powered by AI
                    </p>
                    <div className='mt-4'>
                        <Button disabled={isUploading}>
                            <Upload className='h-5 w-5 mr-2' aria-hidden='true'/>
                            Upload Meeting
                            <input className='hidden' {...getInputProps()}/>
                        </Button>

                    </div>
                </>
            )}
            {isUploading && (
                <div className='flex flex-col items-center justify-center'>
                    <Presentation className='size-20 animate-bounce'/>
                    <br/>
                    <p className=' text-gray-500 text-center flex gap-2'>
                    <Loader2  className='animate-spin '/>
                        Uploading your meeting...
                    </p>
                </div>
            )}
        </Card>
  )
}

export default MeetingCard