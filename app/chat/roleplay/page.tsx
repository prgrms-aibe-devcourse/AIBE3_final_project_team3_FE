import Footer from '../../components/Footer';
import Header from '../../components/Header';
import MainContent from '../../components/MainContent';

export default function RolePlayChat() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <MainContent>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">상황극 채팅</h1>
        </div>
      </MainContent>
      <Footer />
    </div>
  );
}