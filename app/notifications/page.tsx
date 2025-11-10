import Footer from '../components/Footer';
import Header from '../components/Header';
import MainContent from '../components/MainContent';
import NotificationList from './components/NotificationList';

export default function Notifications() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <MainContent>
        <NotificationList />
      </MainContent>
      <Footer />
    </div>
  );
}