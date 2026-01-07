'use client'

import type React from 'react'
import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'

interface SignInProps {
  onSwitchToSignUp: () => void
  onBack: () => void
}

export function SignIn({ onSwitchToSignUp, onBack }: SignInProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { error: signInError } = await signIn(email, password)

    if (signInError) {
      setError(signInError.message)
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-background flex items-center justify-center p-4'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className='w-full max-w-md'
      >
        <Button variant='ghost' onClick={onBack} className='mb-6 text-muted-foreground hover:text-foreground'>
          <ArrowLeft className='w-4 h-4 mr-2' />
          Back to Home
        </Button>

        <Card className='border-border shadow-lg'>
          <CardHeader className='text-center'>
            <CardTitle className='text-2xl font-bold font-[var(--font-heading)]'>Welcome Back</CardTitle>
            <CardDescription className='font-[var(--font-body)]'>
              Sign in to your account to continue your AI conversations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='email' className='font-[var(--font-body)]'>
                  Email
                </Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='Enter your email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className='bg-input border-border'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='password' className='font-[var(--font-body)]'>
                  Password
                </Label>
                <div className='relative'>
                  <Input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    placeholder='Enter your password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className='bg-input border-border pr-10'
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className='h-4 w-4 text-muted-foreground' />
                    ) : (
                      <Eye className='h-4 w-4 text-muted-foreground' />
                    )}
                  </Button>
                </div>
              </div>

              {error && <p className='text-destructive text-sm font-[var(--font-body)] text-center'>{error}</p>}

              <Button
                type='submit'
                className='w-full bg-primary hover:bg-primary/90 text-primary-foreground'
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <div className='mt-6 text-center'>
              <p className='text-muted-foreground font-[var(--font-body)]'>
                Don't have an account?{' '}
                <Button
                  variant='link'
                  onClick={onSwitchToSignUp}
                  className='text-accent hover:text-accent/80 p-0 h-auto font-semibold'
                >
                  Sign up
                </Button>
              </p>
            </div>

            <div className='mt-4 text-center'>
              <Button variant='link' className='text-muted-foreground hover:text-foreground p-0 h-auto text-sm'>
                Forgot your password?
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}