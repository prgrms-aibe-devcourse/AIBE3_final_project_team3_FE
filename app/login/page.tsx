import Footer from '../components/Footer';
import Header from '../components/Header';
import MainContent from '../components/MainContent';
import LoginForm from './components/LoginForm';

export default function Login() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <MainContent>
        <LoginForm />
      </MainContent>
      <Footer />
    </div>
  );
}