import { useEffect } from "react";
import { useRouter } from 'next/router';
import type { GetStaticProps, GetStaticPaths } from "next";
import { useSession } from 'next-auth/react';
import { getPrismicClient } from './../../../services/prismic';
import { RichText } from 'prismic-dom';
import Head from "next/head";

import styled from '../post.module.scss';
import Link from "next/link";

type Post = {
  slug: string;
  title: string;
  content: string;
  updatedAt: string;
}

interface PostsProps {
  post: Post;
}

export default function PostPreview({ post }: PostsProps) {
  const { data, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (data?.activeSubscription) {
      router.push(`/posts/${post.slug}`);
    }
  }, [data, post.slug, router]);

  return (
    <>
      <Head>
        <title>{post.title} | Ignews</title>
      </Head>

      <main className={styled.container}>
        <article className={styled.post}>
          <h1>{post.title}</h1>
          <time>{post.updatedAt}</time>
          <div 
            className={`${styled.postContent} ${styled.previewContent}`}
            dangerouslySetInnerHTML={{ __html: post.content }} 
          />

          <div className={styled.continueReading}>
            Wanna continue reading?
            <Link href="/">
              <a> Subscribe now 😊</a>
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params || { slug: '' };

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('publication', String(slug), {});

  const post = {
    slug,
    title: RichText.asText(response.data.title),
    content: RichText.asHtml(response.data.content.splice(0, 3)),
    updatedAt: new Date(response.last_publication_date || '').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
  };
  
  return {
    props: {
      post
    },
    revalidate: 60 * 30, // 30 minutos
  };
}
