import React, { useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  Moon,
  ShieldAlert,
  Sun,
} from 'lucide-react'
import { useStore } from '../context/StoreContext.jsx'
import { Mark } from '../components/Icons.jsx'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function SignInScreen() {
  const { data, route, session, theme, toggleTheme, setPortalPreview, signInAsRole } =
    useStore()
  const portal =
    (route.params.portal || session.portalPreview) === 'console' ? 'console' : 'school'
  const citu = data.schools.find((s) => s.id === 'citu') || data.schools[0]

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !password || password === 'wrong') {
      setErrorMsg('Wrong email or password.')
      return
    }
    setErrorMsg('')
    if (trimmed.includes('no-role') || trimmed.includes('unassigned')) {
      signInAsRole('unassigned', { email: trimmed, who: 'New Scholar' })
      return
    }
    if (trimmed.includes('paolo') || trimmed.includes('central')) {
      signInAsRole('central')
    } else if (trimmed.includes('lara') || trimmed.includes('admin')) {
      signInAsRole('admin')
    } else if (trimmed.includes('ana') || portal === 'console') {
      signInAsRole('regional')
    } else if (trimmed.includes('ruel') || trimmed.includes('coord')) {
      signInAsRole('coordinator')
    } else {
      signInAsRole('scholar')
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-10">
      <div className="absolute top-4 right-4">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Toggle theme"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-3">
          <span className="size-10 shrink-0">
            <Mark
              kind={portal === 'console' ? 'seiskolar' : 'school'}
              primary={citu.primaryColor}
              accent={citu.accentColor}
            />
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-tight">
              {portal === 'console' ? 'SEIskolar' : citu.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {portal === 'console'
                ? 'DOST-SEI Regional & Central Console'
                : 'Scholar Portal · Powered by SEIskolar'}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-xl">Sign in</CardTitle>
              <Tabs
                value={portal}
                onValueChange={(val) => {
                  setErrorMsg('')
                  setPortalPreview(val)
                }}
              >
                <TabsList>
                  <TabsTrigger value="school">School portal</TabsTrigger>
                  <TabsTrigger value="console">DOST console</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <CardDescription>
              {portal === 'console'
                ? 'Sign in with your DOST Regional, Central, or Admin account.'
                : 'Sign in with your university scholar or coordinator account.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMsg && (
              <Alert variant="destructive" role="alert">
                <AlertCircle className="size-4" />
                <AlertTitle>Sign-in failed</AlertTitle>
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  autoComplete="username"
                  placeholder={
                    portal === 'console'
                      ? 'ana.villareal@example.test'
                      : 'bea.santiago@example.test'
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter any password (or 'wrong' to test error)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full">
                Sign in
                <ArrowRight className="ml-1.5 size-4" />
              </Button>
            </form>
          </CardContent>

          <Separator />

          <CardFooter className="flex-col items-stretch gap-2.5 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Quick prototype sign-in
              </span>
              <button
                type="button"
                className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                onClick={() => {
                  setEmail('bea.santiago@example.test')
                  setPassword('wrong')
                  setErrorMsg('Wrong email or password.')
                }}
              >
                Preview wrong password
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {portal !== 'console' ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => signInAsRole('scholar')}
                  >
                    Scholar · Bea Santiago
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => signInAsRole('coordinator')}
                  >
                    Coordinator · Ruel Mendoza
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="justify-start sm:col-span-2"
                    onClick={() =>
                      signInAsRole('unassigned', {
                        email: 'bea.santiago@example.test',
                      })
                    }
                  >
                    Unassigned account (Account not ready)
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => signInAsRole('regional')}
                  >
                    Regional · Ana Villareal
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => signInAsRole('central')}
                  >
                    Central · Paolo Reyes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="justify-start sm:col-span-2"
                    onClick={() => signInAsRole('admin')}
                  >
                    System admin · Lara Domingo
                  </Button>
                </>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export function NoAccessScreen() {
  const { data, session, signOut } = useStore()
  const citu = data.schools.find((s) => s.id === 'citu') || data.schools[0]

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="size-9 shrink-0">
              <Mark kind="school" primary={citu.primaryColor} accent={citu.accentColor} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{citu.name}</p>
              <p className="text-xs text-muted-foreground">Scholar Portal</p>
            </div>
          </div>
          <div className="flex size-10 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <LockKeyhole className="size-5" />
          </div>
          <CardTitle className="text-xl">Your account isn't ready yet</CardTitle>
          <CardDescription className="font-mono text-xs">
            Signed in as {session.email || 'bea.santiago@example.test'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p className="text-foreground">
            Your account has no role, region or school yet, so there is nothing to show
            you.
          </p>
          <p>Your DOST Regional Office sets up scholar accounts.</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={() => signOut('school')}>
            Sign out
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export function NothingFoundScreen() {
  const { activeRole, navigate } = useStore()
  return (
    <div className="mx-auto max-w-lg py-10">
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex size-10 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <ShieldAlert className="size-5" />
          </div>
          <CardTitle>Nothing to show here</CardTitle>
          <CardDescription>
            There is no record at this address that your account can see. If someone sent
            you the link, it may be for someone else's record.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            variant="outline"
            onClick={() => navigate(activeRole ? activeRole.homeScreen : 'sign-in')}
          >
            <ArrowLeft className="mr-1.5 size-4" />
            Back to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
