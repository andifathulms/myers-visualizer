import { notFound } from 'next/navigation'
import { CompareView } from '@/components/compare/CompareView'
import { getDict } from '@/lib/i18n/dictionary'
import { LOCALES, isLocale } from '@/lib/i18n/locales'
import { metadataFor } from '@/lib/seo'

/** Title, description, canonical and hreflang, from this page's own copy. */
export function generateMetadata({ params }: { params: { locale: string } }) {
  return isLocale(params.locale) ? metadataFor(params.locale, 'banding') : {}
}

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function BandingPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return <CompareView locale={params.locale} dict={getDict(params.locale)} />
}
