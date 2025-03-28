import React, { Fragment } from 'react'
import { Sheet, SheetTrigger } from '~/components/ui/sheet';
import useProject from '~/hooks/use-project'
import { api } from '~/trpc/react';
import AskQuestionCard from '../dashboard/ask-question-card';

const QAPage = () => {
  const {projectId}=useProject();
  const {data: questions}= api.project.getQuestions.useQuery({projectId}); 
  
  return (
    <Sheet>
      <AskQuestionCard/>
      <div className='h-4'></div>
      <h1 className='text-xl font-semibold'>Saved Question</h1>
      <div className="h-2"></div>
      <div className="flex flex-col gap-2">
        {questions?.map((question, index)=>{
            return <Fragment key={question.id}>
                <SheetTrigger>

                </SheetTrigger>
            </Fragment>
        })}
      </div>
    </Sheet>
  )
}

export default QAPage