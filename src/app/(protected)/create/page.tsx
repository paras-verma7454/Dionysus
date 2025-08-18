"use client"
import React from 'react'
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { api } from '~/trpc/react';
import useRefetch from '~/hooks/use-refetch';
import { Info } from 'lucide-react';
import { redirect } from 'next/navigation';

type FormInput= {
    repoUrl: string;
    projectName: string;
    gitHubToken?: string;
}

const Create = () => {

    const {register, handleSubmit, reset}= useForm<FormInput>()
    const createProject= api.project.createProject.useMutation();
    const checkCredits = api.project.checkCredits.useMutation();
    const refetch = useRefetch();

    function onSubmit(data: FormInput){
        const {projectName, repoUrl, gitHubToken}= data;
        if (!!checkCredits.data){
            createProject.mutate({name: projectName, repoUrl, gitHubToken},{
                onSuccess: () => {
                    toast.success("Project created successfully");
                    redirect('/dashboard')
                },
                onError: (error) => {
                    console.log("error")
                        toast.error("Failed to create project");
                }
            })

        }else{
            checkCredits.mutate({githubUrl: repoUrl, githubToken: gitHubToken as string});
        }
        
        // window.alert(JSON.stringify(data,null,2))
        return true;
    }

    const hasEnoughCredits = checkCredits?.data?.credits ? checkCredits.data.fileCount <= checkCredits.data.credits : true

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
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Input {...register('projectName', {required: true})} placeholder='Project Name' required />
                    <div className='h-2'></div>
                    <Input {...register('repoUrl', {required: true})} type='url' placeholder='GitHub Repository URL' required />
                    {!!checkCredits.data && (
                        <>
                            <div className='mt-4 bg-orange-50 px-4 py-2 rounded-md border border-orange-200 text-orange-700'>
                                <div className='flex items-center gap-2'>
                                    <Info/>
                                    <p className='text-sm'>
                                        You will be charged <strong>{checkCredits.data?.fileCount}</strong> credits for this repository.
                                    </p>
                                </div>
                                <p className='text-sm text-blue-600 ml-8'>
                                    You have <strong>{checkCredits.data?.credits}</strong> credits remaining.
                                </p>
                            </div>
                        </>
                    )}
                    <div className='h-2'></div>
                    <Input {...register('gitHubToken')} placeholder='GitHub access token' />
                    <Button type='submit' className='mt-4' disabled={createProject.isPending || !!checkCredits.isPending || !hasEnoughCredits}>
                        {!!checkCredits.data ? "Create Project" : "Check Credits"}
                    </Button>
                </form>
            </div>
        </div>
    </div>
  )
}

export default Create