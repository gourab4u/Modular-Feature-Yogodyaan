import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { InstructorProvider } from './src/features/scheduling/components/InstructorProvider';
import InstructorProfile from './src/features/scheduling/pages/InstructorProfile';
import { InstructorRatesPage } from './src/features/instructor-rates/pages/InstructorRatesPage';
// ...existing imports...

function App() {
    return (
        <Router>
            <InstructorProvider>
                <div className="App">
                    {/* ...existing code... */}
                    <Routes>
                        {/* ...existing routes... */}
                        <Route path="/instructor/:instructorId" element={<InstructorProfile />} />
                        <Route path="/manage-rates" element={<InstructorRatesPage />} />
                    </Routes>
                </div>
            </InstructorProvider>
        </Router>
    );
}

export default App;