import { HTMLAttributes, useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { toast } from 'sonner'
import { config } from '@/config/env'


interface UserAuthFormProps extends HTMLAttributes<HTMLDivElement> {
  message?: string | null
}

const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Please enter your email' })
    .email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(1, {
      message: 'Please enter your password',
    })
    .min(7, {
      message: 'Password must be at least 7 characters long',
    }),
})

export function UserAuthForm({ className, message, ...props }: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Show message toast on mount if exists
  useEffect(() => {
    if (message) {
      toast(message)
    }
  }, [message])

  function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    // eslint-disable-next-line no-console
    console.log(data)

    setTimeout(() => {
      setIsLoading(false)
    }, 3000)
  }

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className='grid gap-2'>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                className='w-3/4 mx-auto h-12' 
                type='button'
                disabled={isLoading}
                onClick={() => window.location.href = `${config.apiBaseUrl}/auth/login`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" className="shrink-0">
                  <path fill="#F25022" d="M1 1h9v9H1z" />
                  <path fill="#00A4EF" d="M1 11h9v9H1z" />
                  <path fill="#7FBA00" d="M11 1h9v9h-9z" />
                  <path fill="#FFB900" d="M11 11h9v9h-9z" />
                </svg>
                Sign in with Microsoft
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
