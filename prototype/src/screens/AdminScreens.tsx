import React, { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { useStore } from '../context/StoreContext.jsx'
import { PageHeader, StatusBadge } from '../components/ui-helpers.tsx'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

export function AdminStaffAccounts() {
  const { data, createStaffAccount } = useStore()
  const [email, setEmail] = useState('mia.cortez@example.test')
  const [name, setName] = useState('Mia Cortez')
  const [role, setRole] = useState('Central Office')
  const [region, setRegion] = useState('DOST-VII')
  const [err, setErr] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !name.trim()) {
      setErr('Enter email and full name.')
      return
    }
    setErr('')
    createStaffAccount({
      email: email.trim(),
      name: name.trim(),
      role,
      region,
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="System administration"
        title="DOST staff accounts"
        description="Accounts for the Regional Offices and Central Office."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{data.staffAccounts.length} accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Account</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.staffAccounts.map((acc, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{acc.name}</TableCell>
                      <TableCell>{acc.role}</TableCell>
                      <TableCell>{acc.region}</TableCell>
                      <TableCell>
                        <StatusBadge
                          status={acc.signedIn ? 'verified' : 'off'}
                          label={acc.signedIn ? 'Signed in' : 'Not signed in yet'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add a staff account</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {err && (
                <Alert variant="destructive" role="alert">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{err}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="adm-email">Email</Label>
                <Input
                  type="email"
                  id="adm-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adm-name">Full name</Label>
                <Input
                  id="adm-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <RadioGroup value={role} onValueChange={setRole}>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <RadioGroupItem value="Regional Office" />
                    Regional Office
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <RadioGroupItem value="Central Office" />
                    Central Office
                  </label>
                </RadioGroup>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adm-reg">Region</Label>
                {role === 'Central Office' ? (
                  <Input
                    id="adm-reg"
                    readOnly
                    className="bg-muted text-muted-foreground"
                    value="Every region, for Central Office"
                  />
                ) : (
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger id="adm-reg" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {data.regions.map((r) => (
                        <SelectItem key={r.code} value={`DOST-${r.code}`}>
                          DOST-{r.code} ({r.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">
                  A Regional Office account belongs to one region.
                </p>
              </div>
              <Button type="submit" className="w-full">
                Create the account
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function AdminRegions() {
  const { data, createRegion } = useStore()
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [office, setOffice] = useState('')
  const [address, setAddress] = useState('')
  const [runBy, setRunBy] = useState('A DOST Regional Office')
  const [inUseFrom, setInUseFrom] = useState('')
  const [until, setUntil] = useState('')
  const [err, setErr] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || !name.trim() || !office.trim()) {
      setErr('Fill in code, region name, and office name.')
      return
    }
    setErr('')
    createRegion({
      code: code.trim(),
      name: name.trim(),
      office: office.trim(),
      address: address.trim(),
      runBy,
      inUseFrom,
      until,
    })
    setCode('')
    setName('')
    setOffice('')
    setAddress('')
    setInUseFrom('')
    setUntil('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="System administration"
        title="Regions"
        description="Reference data: the regions, and the office that supervises each."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Regions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Office</TableHead>
                    <TableHead>In use</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.regions.map((r) => (
                    <TableRow key={r.code}>
                      <TableCell className="font-mono font-medium">{r.code}</TableCell>
                      <TableCell>{r.name}</TableCell>
                      <TableCell className="text-muted-foreground">{r.office}</TableCell>
                      <TableCell>
                        <StatusBadge
                          status={r.inUse ? 'ok' : 'off'}
                          label={r.inUse ? 'Yes' : 'No'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add a region</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {err && (
                <Alert variant="destructive" role="alert">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{err}</AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-code">Code</Label>
                  <Input
                    placeholder="e.g. VIII"
                    id="reg-code"
                    className="font-mono uppercase"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-name">Name</Label>
                  <Input
                    placeholder="e.g. Eastern Visayas"
                    id="reg-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-office">Office name</Label>
                <Input
                  placeholder="e.g. DOST-VIII Regional Office"
                  id="reg-office"
                  value={office}
                  onChange={(e) => setOffice(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-addr">Office address</Label>
                <Textarea
                  rows={2}
                  id="reg-addr"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Run by</Label>
                <RadioGroup value={runBy} onValueChange={setRunBy}>
                  {['A DOST Regional Office', 'An autonomous ministry'].map((opt) => (
                    <label
                      className="flex cursor-pointer items-center gap-2 text-sm"
                      key={opt}
                    >
                      <RadioGroupItem value={opt} />
                      {opt}
                    </label>
                  ))}
                </RadioGroup>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-from">In use from</Label>
                  <Input
                    type="date"
                    id="reg-from"
                    value={inUseFrom}
                    onChange={(e) => setInUseFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-until">Until (optional)</Label>
                  <Input
                    type="date"
                    id="reg-until"
                    value={until}
                    onChange={(e) => setUntil(e.target.value)}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Save the region
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
