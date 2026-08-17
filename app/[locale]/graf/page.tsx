import { notFound } from 'next/navigation'
import { GraphViewBoundary } from '@/components/graf/GraphViewBoundary'
import { getDict } from '@/lib/i18n/dictionary'
import { LOCALES, isLocale } from '@/lib/i18n/locales'
import { metadataFor } from '@/lib/seo'

/** Title, description, canonical and hreflang, from this page's own copy. */
export function generateMetadata({ params }: { params: { locale: string } }) {
  return isLocale(params.locale) ? metadataFor(params.locale, 'graf') : {}
}

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function GrafPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return <GraphViewBoundary locale={params.locale} dict={getDict(params.locale)} />
}
