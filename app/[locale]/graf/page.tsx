import { notFound } from 'next/navigation'
import { GraphView } from '@/components/graf/GraphView'
import { getDict } from '@/lib/i18n/dictionary'
import { LOCALES, isLocale } from '@/lib/i18n/locales'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function GrafPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return <GraphView locale={params.locale} dict={getDict(params.locale)} />
}
