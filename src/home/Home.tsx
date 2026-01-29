
import { Footer } from '../components/layout';
import { FlyThroughHero } from './components/FlyThroughHero';

export const Home = () => {
  return (
    <main>
      <section className="visually-hidden" aria-label="Founders House overview">
        <h1>Founders House - Helsinki</h1>
        <p>Built for the obsessed. Built for the exceptional.</p>
        <p>A premium community space in Helsinki for ambitious founders.</p>
      </section>
      <FlyThroughHero />
      <Footer />
    </main>
  );
};

export default Home;
