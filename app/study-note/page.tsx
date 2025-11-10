import Footer from '../components/Footer';
import Header from '../components/Header';
import MainContent from '../components/MainContent';
import StudyNoteList from './components/StudyNoteList';

export default function StudyNote() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <MainContent>
        <StudyNoteList />
      </MainContent>
      <Footer />
    </div>
  );
}