import './App.css'
import Navbar          from './components/Navbar'
import Hero            from './components/Hero'
import FeaturesBar     from './components/FeaturesBar'
import Categories      from './components/Categories'
import FeaturedProducts from './components/FeaturedProducts'
import PromoBanner     from './components/PromoBanner'
import Testimonials    from './components/Testimonials'
import Newsletter      from './components/Newsletter'
import Footer          from './components/Footer'

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main>
        <Hero />
        <FeaturesBar />
        <Categories />
        <FeaturedProducts />
        <PromoBanner />
        <Testimonials />
        <Newsletter />
      </main>
      <Footer />
    </div>
  )
}
