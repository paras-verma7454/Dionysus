"use client"
import React, { Fragment, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '~/components/ui/sheet';
import useProject from '~/hooks/use-project'
import { api } from '~/trpc/react';
import AskQuestionCard from '../dashboard/ask-question-card';
import MarkdownPreview from '@uiw/react-markdown-preview';
import CodeRefrence from '../dashboard/code-refrence';
import { useTheme } from 'next-themes';

const QAPage = () => {
  const {projectId}=useProject();
  const {data: questions}= api.project.getQuestions.useQuery({projectId}); 
  const { theme } = useTheme()
  const  [questionIndex, setQuestionIndex] = useState(0);
  const question = questions?.[questionIndex];

  return (
    <Sheet>
      <AskQuestionCard/>
      <div className='h-4'></div>
      <h1 className='text-xl font-semibold'>Saved Question</h1>
      <div className="h-2"></div>
      <div className="flex flex-col gap-2">
        {questions?.map((question, index)=>{
            return <Fragment key={question.id}>
                <SheetTrigger onClick={()=> setQuestionIndex(index)}>
                    <div className='flex items-center gap-4  rounded-lg p-4 shadow border'>
                        <img className='rounded-full' height={30} width={30} src={question.user.imageUrl ?? ""}/>
                        <div className='text-left flex flex-col'>
                          <div className='flex items-center justify-between '>
                              <p className=' line-clamp-1 text-lg font-medium'>
                                {question.question}
                              </p>
                              <span className='text-sm text-gray-400 whitespace-nowrap '>
                                  {question.createdAt.toLocaleDateString()}
                              </span>
                          </div>
                          <p className='text-gray-500 line-clamp-1 text-sm'>
                            {question.answer}
                          </p>
                        </div>
                    </div>
                </SheetTrigger>
            </Fragment>
        })}
      </div>


      {question && (
        <SheetContent className='sm:max-w-[80vw]'>
          <SheetHeader>
            <SheetTitle>
              {question.question}
            </SheetTitle>
              <MarkdownPreview source={question.answer} 
              style={{ padding: '1rem', background: 'transparent' }} 
              wrapperElement={{
                "data-color-mode": theme === 'dark' ? 'dark' : 'light',
              }}/>
              <div className="h-4"></div>
              <CodeRefrence filesRefrences={(question.filesRefrences ?? []) as any}/>
          </SheetHeader>
        </SheetContent>
      )}
    </Sheet>
  )
}

export default QAPage