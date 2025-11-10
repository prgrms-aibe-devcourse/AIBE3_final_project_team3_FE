import Footer from '../components/Footer';
import Header from '../components/Header';
import MainContent from '../components/MainContent';
import UserProfile from './components/UserProfile';

export default function MyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <MainContent>
        <UserProfile />
      </MainContent>
      <Footer />
    </div>
  );
}