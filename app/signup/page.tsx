import Footer from '../components/Footer';
import Header from '../components/Header';
import MainContent from '../components/MainContent';
import SignupForm from './components/SignupForm';

export default function SignUp() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <MainContent>
        <SignupForm />
      </MainContent>
      <Footer />
    </div>
  );
}