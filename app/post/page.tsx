import Footer from '../components/Footer';
import Header from '../components/Header';
import MainContent from '../components/MainContent';
import PostList from './components/PostList';

export default function Post() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <MainContent>
        <PostList />
      </MainContent>
      <Footer />
    </div>
  );
}