import { notFound } from 'next/navigation'
import { LOCALES, isLocale } from '@/lib/i18n/locales'
import { getDict } from '@/lib/i18n/dictionary'
import { SiteNav } from '@/components/chrome/SiteNav'
import { SiteFooter } from '@/components/chrome/SiteFooter'
import { LocaleLang } from '@/components/chrome/LocaleLang'

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
      <LocaleLang locale={params.locale} />
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-indigo focus:px-3 focus:py-2 focus:font-sans focus:text-sm focus:text-cotton"
      >
        {dict.a11y.skipToContent}
      </a>
      <SiteNav locale={params.locale} dict={dict} />
      <div id="konten" className="flex-1">
        {children}
      </div>
      <SiteFooter locale={params.locale} />
    </div>
  )
}
