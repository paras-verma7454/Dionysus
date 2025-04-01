"use client"

import { Info } from 'lucide-react'
import React, { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Slider } from '~/components/ui/slider'
import { createCheckoutSession } from '~/lib/stripe'
import { api } from '~/trpc/react'

const BillingPage = () => {
    const {data:user} = api.project.getMyCredits.useQuery()
    const [creditsToBuy,setCreditsToBuy] = useState<number[]>([100]);
    const creditsToBuyAmout = creditsToBuy[0]!
    const price = (creditsToBuyAmout/50).toFixed(2)
    
  return (
    <div>
        <h1 className='text-xl font-semibold'>
            Billing
        </h1>
        <div className="h-2"></div>
        <p className='text-sm text-muted-foreground'>
            You currenlty have <span className='font-bold'>{user?.credits}</span> credits.
        </p>
        <div className="h-2"></div>
        <div className='bg-primary/10 px-4 py-2 rounded-md border border-primary/30 text-primary'>
            <div className='flex items-center gap-2'>
                <Info className='size-4'/>
                <p className='text-sm'>
                    Each credit allows you to index 1 file in a repository.
                </p>
            </div>
            <p className='text-sm'>
                E.g. If your project has 100 files , you will need 100 credits to index it.
            </p>
        </div>
        <div className="h-4"></div>
        <Slider defaultValue={[100]} max={1000} step={10} min={10} onValueChange={(value) => setCreditsToBuy(value) } value={creditsToBuy}/>
        <div className="h-4"></div>
        <Button onClick={()=>{
            createCheckoutSession(creditsToBuyAmout)
        }}>
            Buy {creditsToBuyAmout} Credits for ${price}
        </Button>
    </div>
  )
}

export default BillingPage