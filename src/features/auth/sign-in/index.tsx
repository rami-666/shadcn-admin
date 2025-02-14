import { Card } from '@/components/ui/card'
import AuthLayout from '../auth-layout'
import { UserAuthForm } from './components/user-auth-form'
import { useLocation } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'

export default function SignIn() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const message = urlParams.get('message');

  return (
    <AuthLayout>
      <Card className='p-6'>
        <div className='flex flex-col space-y-2 text-left'>
          <h1 className='text-2xl font-semibold tracking-tight text-center'>Login</h1>
          <p className='text-sm text-muted-foreground text-center pb-6'>
          Sign in with your Azure account
          </p>
        </div>
        <UserAuthForm message={message} />
        <div className="space-y-4 pt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">By continuing, you agree to our</span>
            </div>
          </div>

          <p className="text-sm text-center text-muted-foreground px-6">
            <Link href="/terms" className="underline underline-offset-4 hover:text-primary transition-colors">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-primary transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>
      </Card>
    </AuthLayout>
  )
}
