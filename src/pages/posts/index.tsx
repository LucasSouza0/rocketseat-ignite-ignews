import { GetStaticProps } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

import styled from './styles.module.scss';
import { getPrismicClient } from './../../services/prismic';

type Post = {
  slug: string;
  title: string;
  excerp: string;
  updatedAt: string;
}

interface PostsProps {
  posts: Post[];
}

export default function MyApp({ posts }: PostsProps) {
  return (
    <>
      <Head>
        <title>Posts | Ignews</title>
      </Head>

      <main className={styled.container}>
        <div className={styled.posts}>
          {posts.map(post => (
            <Link key={post.slug} href={`/posts/preview/${post.slug}`}>
              <a key={post.slug}>
                <time> { post.updatedAt } </time>
                <strong> { post.title } </strong>
                <p> { post.excerp } </p>
              </a>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const response = await prismic.query([
    Prismic.predicates.at('document.type', 'publication')
  ], {
    fetch: ['publication.title', 'publication.content'],
    pageSize: 100,
  });

  const posts = response.results.map(post => {
    return {
      slug: post.uid,
      title: RichText.asText(post.data.title),
      excerp: post.data.content.find((content: any) => content.type === 'paragraph')?.text ?? '',
      updatedAt: new Date(post.last_publication_date || '').toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
    }
  });

  return {
    props: { posts }
  }
}
