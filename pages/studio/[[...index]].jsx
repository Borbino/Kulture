import Head from 'next/head'
import { NextStudio } from 'next-sanity/studio'
import config from '../../sanity.config'

export default function StudioPage() {
  return (
    <>
      <Head>
        <title>CEO 지휘실 - Kulture</title>
        <meta name="robots" content="noindex" />
      </Head>
      <NextStudio config={config} />
    </>
  )
}
