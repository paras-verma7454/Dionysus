"use client"

import React, { useState } from 'react'
import { Button } from '~/components/ui/button';
import { Tabs, TabsContent } from '~/components/ui/tabs';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {lucario} from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '~/lib/utils';

type Props ={
    filesRefrences:{
        fileName:string;
        sourceCode: string;
        summary:string;
    }[]
}
const CodeRefrence = ({ filesRefrences }: Props) => {
    const [tab,setTab] = useState(filesRefrences[0]?.fileName);
    if (filesRefrences.length === 0) return null

  return (
    <div className='max-w-[70vw]'>
       <Tabs value={tab} onValueChange={setTab}>
        <div className='overflow-scroll flex gap-1 bg-gray-200  p-1 rounded-md'>
            {filesRefrences.map((file )=>(
                <Button variant={'outline'} onClick={()=>setTab(file.fileName)} key={file.fileName} className={cn(
                    'p-1 text-sm font-medium  rounded-md transition-colors whitespace-nowrap text-muted-foreground bg-transparent hover:bg-muted',
                    {
                        'bg-primary text-primary-foreground':  tab === file.fileName,
                    }
                )}>
                    {file.fileName}
                </Button>
            ))}
        </div>
        {filesRefrences.map((file)=>(
            <TabsContent key={file.fileName} value={file.fileName} className='max-h-[40vh] overflow-scroll max-w-7xl rounded-md'>
                <SyntaxHighlighter language='typescript' style={lucario}>
                    {file.sourceCode}
                </SyntaxHighlighter>
            </TabsContent>
        ))}
       </Tabs>
    </div>
  )
}

export default CodeRefrence