import Footer from '../components/Footer';
import Header from '../components/Header';
import MainContent from '../components/MainContent';
import ReportList from './components/ReportList';

export default function Report() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <MainContent>
        <ReportList />
      </MainContent>
      <Footer />
    </div>
  );
}