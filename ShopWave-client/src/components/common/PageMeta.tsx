"use client";
import Head from "next/head";

export default function PageMeta({ title, description }: { title: string; description?: string }) {
  return (
    <Head>
      <title>{title}</title>
      {description ? <meta name="description" content={description} /> : null}
    </Head>
  );
}
