/**
 * A school's portal wears the school's colours, as its coordinator set them (FR-ADM-003,
 * S09.1). Every screen under /s/[school] sits inside this.
 */
import type { Viewport } from 'next'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { directory } from '@/lib/backend'
import { brandColours, brandTokens } from '@/lib/portal/brand'
import type { SchoolParams } from '@/lib/portal/school-route'

export async function generateViewport({
  params,
}: {
  params: SchoolParams
}): Promise<Viewport> {
  const school = await directory.schoolBySubdomain((await params).school)
  return school
    ? { themeColor: brandColours(school.primaryColour, school.secondaryColour).brand }
    : {}
}

interface SchoolLayoutProps {
  children: ReactNode
  params: SchoolParams
}

export default async function SchoolLayout({ children, params }: SchoolLayoutProps) {
  const school = await directory.schoolBySubdomain((await params).school)
  if (!school) notFound()

  return (
    <div style={brandTokens(school.primaryColour, school.secondaryColour)}>
      {children}
    </div>
  )
}
