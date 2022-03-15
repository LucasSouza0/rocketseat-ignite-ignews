import type { NextPage, GetStaticProps } from 'next';
import Head from 'next/head';

import { SubscribeButton } from '../components/SubscribeButton';

import styles from '../styles/Home/style.module.scss';
import { stripe } from './../services/stripe';

interface HomeProps {
  product: {
    priceId: string;
    amount: number;
  }
}

const Home: NextPage<HomeProps> = ({ product }) => {
  return (
    <>
      <Head> 
        <title> Home | ig.news </title>
      </Head>

      <main className={styles.contentContainer}>
        <section className={styles.hero}>
          <span> 👏 Hey, welcome </span>
          <h1> News about the <span> React </span> world. </h1>
          <p>
            Get access to all the publications <br />
            <span> for {product.amount} month </span>
          </p>
          <SubscribeButton priceId={product.priceId} />
        </section>

        <img src="/images/avatar.svg" alt="Girl coding" />
      </main>
    </>
  )
}

export default Home;

export const getStaticProps: GetStaticProps = async () => {
    const price = await stripe.prices.retrieve('price_1KWVq0Esd3m6a9cH7PsiXg9I');

    const product = {
      priceId: price.id,
      amount: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format((price.unit_amount ? price.unit_amount : 0) / 100),
    }

  return {
    props: {
      product,
    },
    revalidate: 60 * 60 * 24, // 24 horas
  }
}
