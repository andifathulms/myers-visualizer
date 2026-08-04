import { notFound } from 'next/navigation'
import { LOCALES, isLocale } from '@/lib/i18n/locales'
import { getDict } from '@/lib/i18n/dictionary'
import { SiteNav } from '@/components/chrome/SiteNav'
import { SiteFooter } from '@/components/chrome/SiteFooter'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export const dynamicParams = false

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!isLocale(params.locale)) notFound()
  const dict = getDict(params.locale)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav locale={params.locale} dict={dict} />
      <div className="flex-1">{children}</div>
      <SiteFooter locale={params.locale} />
    </div>
  )
}
