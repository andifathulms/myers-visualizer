import { notFound } from 'next/navigation'
import { CompareView } from '@/components/compare/CompareView'
import { getDict } from '@/lib/i18n/dictionary'
import { LOCALES, isLocale } from '@/lib/i18n/locales'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function BandingPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return <CompareView locale={params.locale} dict={getDict(params.locale)} />
}
