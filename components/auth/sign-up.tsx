'use client'

import type React from 'react'
import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'

interface SignUpProps {
  onSwitchToSignIn: () => void
  onBack: () => void
}

export function SignUp({ onSwitchToSignIn, onBack }: SignUpProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const { signUp } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setError(null)

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long')
      return
    }

    if (!acceptTerms) {
      return
    }

    setIsLoading(true)

    const { error: signUpError } = await signUp(email, password, name)

    if (signUpError) {
      setError(signUpError.message)
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
            <CardTitle className='text-2xl font-bold font-[var(--font-heading)]'>Create Account</CardTitle>
            <CardDescription className='font-[var(--font-body)]'>
              Join thousands of users experiencing the future of AI conversation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='name' className='font-[var(--font-body)]'>
                  Full Name
                </Label>
                <Input
                  id='name'
                  type='text'
                  placeholder='Enter your full name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className='bg-input border-border'
                />
              </div>

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
                    placeholder='Create a password'
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

              <div className='space-y-2'>
                <Label htmlFor='confirmPassword' className='font-[var(--font-body)]'>
                  Confirm Password
                </Label>
                <div className='relative'>
                  <Input
                    id='confirmPassword'
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder='Confirm your password'
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className='bg-input border-border pr-10'
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className='h-4 w-4 text-muted-foreground' />
                    ) : (
                      <Eye className='h-4 w-4 text-muted-foreground' />
                    )}
                  </Button>
                </div>
              </div>

              {passwordError && <p className='text-destructive text-sm font-[var(--font-body)]'>{passwordError}</p>}
              {error && <p className='text-destructive text-sm font-[var(--font-body)] text-center'>{error}</p>}

              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='terms'
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                />
                <Label
                  htmlFor='terms'
                  className='text-sm font-[var(--font-body)] leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                >
                  I agree to the{' '}
                  <Button variant='link' className='text-accent hover:text-accent/80 p-0 h-auto text-sm'>
                    Terms of Service
                  </Button>{' '}
                  and{' '}
                  <Button variant='link' className='text-accent hover:text-accent/80 p-0 h-auto text-sm'>
                    Privacy Policy
                  </Button>
                </Label>
              </div>

              <Button
                type='submit'
                className='w-full bg-primary hover:bg-primary/90 text-primary-foreground'
                disabled={isLoading || !acceptTerms}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className='mt-6 text-center'>
              <p className='text-muted-foreground font-[var(--font-body)]'>
                Already have an account?{' '}
                <Button
                  variant='link'
                  onClick={onSwitchToSignIn}
                  className='text-accent hover:text-accent/80 p-0 h-auto font-semibold'
                >
                  Sign in
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}