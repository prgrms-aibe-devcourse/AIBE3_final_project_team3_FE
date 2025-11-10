import Footer from './components/Footer';
import Header from './components/Header';
import MainContent from './components/MainContent';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <MainContent>
        <div className="space-y-8">
          <h1 className="text-3xl font-bold text-center">Main</h1>
        </div>
      </MainContent>
      <Footer />
    </div>
  );
}
