"use client"
import React from 'react'
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { api } from '~/trpc/react';
import useRefetch from '~/hooks/use-refetch';

type FormInput= {
    repoUrl: string;
    projectName: string;
    gitHubToken?: string;
}

const Create = () => {

    const {register, handleSubmit, reset}= useForm<FormInput>()
    const createProject= api.project.createProject.useMutation();
    const refetch = useRefetch();

    function onSubmit(data: FormInput){
        const {projectName, repoUrl, gitHubToken}= data;
        
        createProject.mutate({name: projectName, repoUrl, gitHubToken},{
            onSuccess: () => {
                toast.success("Project created successfully");
                refetch();
            },
            onError: (error) => {
                console.log("error")
                    toast.error("Failed to create project");
            }
        })
        // window.alert(JSON.stringify(data,null,2))
        return true;
    }

  return (
    <div className='flex flex-col md:flex-row items-center justify-center h-full gap-10'>
        <img src={'https://cdni.iconscout.com/illustration/premium/thumb/coder-illustration-download-in-svg-png-gif-file-formats--programmer-developer-developing-programming-businex-colorful-pack-business-illustrations-2895977.png'} className='w-auto h-80 md:-ml-28'   />
        <div className='flex flex-col gap-4'>
            <div>
                <h1 className='font-semibold text-2xl'>
                    Link your GitHub Repository
                </h1>
                <p className='text-sm text-muted-foreground'>
                    Enter the URL of the GitHub repository you want to link to Dionysus.
                </p>
            </div>
            <div className=''></div>
            <div>
                <form onSubmit={handleSubmit(onSubmit)} onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(onSubmit)(); }}>
                    <Input {...register('projectName', {required: true})} placeholder='Project Name' required />
                    <div className='h-2'></div>
                    <Input {...register('repoUrl', {required: true})} type='url' placeholder='GitHub Repository URL' required />
                    <div className='h-2'></div>
                    <Input {...register('gitHubToken')} placeholder='GitHub Token (Optional)' />
                    <Button type='submit' className='mt-4' disabled={createProject.isPending}>
                        {createProject.isPending ? "Creating..." : "Create Project"}
                    </Button>
                </form>
            </div>
        </div>
    </div>
  )
}

export default Create