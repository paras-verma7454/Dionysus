import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import React from 'react'
import { db } from '~/server/db'

type Props = {
    params: Promise<{projectId: string}>
}

const JoinHandler = async (props: Props) => {
    const {projectId}= await props.params
    const {userId} = await auth();
    if(!userId) return redirect('/sign-in')
    const dbUser = await db.user.findUnique({
        where:{
            id:userId
        }
    })

    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    if(!dbUser){
        await db.user.create({
            data:{
                id: userId,
                EmailAddress: user.emailAddresses[0]?.emailAddress ?? "",
                imageUrl: user.imageUrl ?? "",
                firstName: user.firstName ?? "",
                lastName: user.lastName ?? "",
            }
        })
    }
    const project = await db.project.findUnique({
        where:{
            id:projectId
        }
    })
    if(!project) return redirect('/')
        try{
            await db.userToProject.create({
                data:{
                    userId,
                    projectId
                }
            })
        }catch(err){
            console.log('user already in project')
    }
  return redirect(`/dashboard`)
}

export default JoinHandler