"use client"
import React, { use, useState } from 'react'
import useProject from '~/hooks/use-project'
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import Image from 'next/image'
import { readStreamableValue } from 'ai/rsc'
import MarkdownPreview from '@uiw/react-markdown-preview';
import { useTheme } from 'next-themes';
import { api } from '~/trpc/react'
import { toast } from 'sonner'
import useRefetch from '~/hooks/use-refetch'
import { askQuestion } from './action'
import CodeRefrence from './code-refrence'



const AskQuestionCard = () => {
  const {project} = useProject()
  const { theme } = useTheme()
  const [question, setQuestion] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filesReferences, setFilesReferences] = useState<{fileName: string, sourceCode: string, summary: string}[]>([])
  const [answer, setAnswer] = useState('')
  const saveAnswer= api.project.saveAnswer.useMutation()
  
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setAnswer('')
    setFilesReferences([])
    e.preventDefault()
    if (!project?.id) return
    setLoading(true)

    const {output, filesRefrences} = await askQuestion(question, project.id)
    setOpen(true)
    setFilesReferences(filesRefrences)

    for await (const delta of readStreamableValue(output)){
      if(delta){
        setAnswer((ans) => ans + delta)
      }
    }
    setLoading(false)
  }
  const refetch = useRefetch();

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[73vw]"> 
        <DialogHeader>
          <div className="flex items-center gap-2 ">

          <DialogTitle>
            <div className='flex items-center gap-2'>
            <Image src='/favicon.ico' alt='logo' width={40} height={40}/>
            <h1 className='text-2xl font-bold'>Dionysus</h1>
            </div>
          </DialogTitle>

          <Button variant={'outline'} disabled={saveAnswer.isPending} onClick={()=>{
            saveAnswer.mutate({
              projectId: project!.id,
              question,
              answer,
              filesRefrences: filesReferences
            },{
              onSuccess:()=>{
                toast.success('Answer saved successfully')
                refetch();
              },
              onError: (error) => {
                toast.error("Failed to save answer");
              }
            })
          }}>
            Save Answer
          </Button>

          </div>

        </DialogHeader>
      
        <MarkdownPreview source={answer} className='max-w-[70vw] h-full max-h-[30vh] overflow-scroll -mt-2' 
          style={{ padding: '1rem', background: 'transparent' }}
          wrapperElement={{
            "data-color-mode": theme === 'dark' ? 'dark' : 'light',
          }}/>    
        {/* <div className="h-1"></div> */}
        <CodeRefrence filesRefrences={filesReferences} />
        <button type='button' onClick={() => { setOpen(false) }} className='border rounded-md py-2 -mt-3 bg-primary/40'>
          Close
        </button>
      </DialogContent>
    </Dialog>
      
      <Card className='relative col-span-3'>
        <CardHeader>
          <CardTitle>Ask a question</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(e); }}>
            <Textarea className='h-28' placeholder='Which file should I edit to change the home page?' value={question} onChange={(e) => setQuestion(e.target.value)}/>
            <div className="h-4"></div>
            <Button type='submit' disabled={loading}>{loading ? 'Asking Dionysus...' : 'Ask Dionysus!'}</Button>
          </form>
        </CardContent>
      </Card>
      
    </>
  )
}

export default AskQuestionCard
